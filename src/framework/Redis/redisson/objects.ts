import Redis from "../Redis";
import type {
  RAtomicLong,
  RBitSet,
  RBucket,
  RList,
  RMap,
  RQueue,
  RRateLimiter,
  RScoredSortedSet,
  RSet,
  RTopic,
} from "./types";
import { evalNumber } from "./utils";

const CAS_LUA = `
local cur = redis.call('get', KEYS[1]);
if cur == ARGV[1] then
  redis.call('set', KEYS[1], ARGV[2]);
  return 1;
end;
return 0;
`.trim();

const RATE_TRY_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local interval = tonumber(ARGV[3])
local permits = tonumber(ARGV[4])
local conf = redis.call('hmget', key, 'rate', 'interval')
if conf[1] then
  rate = tonumber(conf[1])
  interval = tonumber(conf[2])
end
local bucket = key .. ':bucket'
redis.call('zremrangebyscore', bucket, 0, now - interval)
local n = redis.call('zcard', bucket)
if n + permits > rate then
  return 0
end
for i = 1, permits do
  redis.call('zadd', bucket, now, now .. '-' .. i .. '-' .. math.random(1000000))
end
redis.call('pexpire', bucket, interval)
return 1
`.trim();

export class RedissonAtomicLong implements RAtomicLong {
  constructor(readonly name: string) {}

  private k(): string {
    return `atomic:${this.name}`;
  }

  async get(): Promise<number> {
    const v = await Redis.get(this.k());
    return v == null ? 0 : Number(v);
  }

  async set(value: number): Promise<void> {
    await Redis.set(this.k(), String(value));
  }

  async getAndSet(value: number): Promise<number> {
    const client = await Redis.getClient();
    const prev = await client.getSet(Redis.key(this.k()), String(value));
    return prev == null ? 0 : Number(prev);
  }

  async incrementAndGet(): Promise<number> {
    return Redis.incr(this.k());
  }

  async decrementAndGet(): Promise<number> {
    return Redis.decr(this.k());
  }

  async addAndGet(delta: number): Promise<number> {
    const client = await Redis.getClient();
    return client.incrBy(Redis.key(this.k()), delta);
  }

  async compareAndSet(expect: number, update: number): Promise<boolean> {
    const n = await evalNumber(
      CAS_LUA,
      [Redis.key(this.k())],
      [String(expect), String(update)]
    );
    return n === 1;
  }

  async delete(): Promise<boolean> {
    return (await Redis.del(this.k())) > 0;
  }
}

export class RedissonBucket<T = unknown> implements RBucket<T> {
  constructor(readonly name: string) {}

  private k(): string {
    return `bucket:${this.name}`;
  }

  async get(): Promise<T | null> {
    return Redis.getJSON<T>(this.k());
  }

  async set(value: T, ttlSeconds?: number): Promise<void> {
    await Redis.setJSON(this.k(), value, ttlSeconds);
  }

  async getAndDelete(): Promise<T | null> {
    const v = await this.get();
    if (v != null) await Redis.del(this.k());
    return v;
  }

  async compareAndSet(expect: T, update: T): Promise<boolean> {
    const cur = await this.get();
    if (JSON.stringify(cur) !== JSON.stringify(expect)) return false;
    await this.set(update);
    return true;
  }

  async trySet(value: T, ttlSeconds?: number): Promise<boolean> {
    const ok = await Redis.setNX(
      this.k(),
      JSON.stringify(value),
      ttlSeconds
    );
    return ok;
  }

  async delete(): Promise<boolean> {
    return (await Redis.del(this.k())) > 0;
  }

  async isExists(): Promise<boolean> {
    return Redis.exists(this.k());
  }

  async expire(ttlSeconds: number): Promise<boolean> {
    return Redis.expire(this.k(), ttlSeconds);
  }
}

export class RedissonMap<V = string> implements RMap<V> {
  constructor(readonly name: string) {}

  private k(): string {
    return `map:${this.name}`;
  }

  private ser(v: V): string {
    return typeof v === "string" ? v : JSON.stringify(v);
  }

  private de(raw: string | undefined): V | undefined {
    if (raw === undefined) return undefined;
    try {
      return JSON.parse(raw) as V;
    } catch {
      return raw as V;
    }
  }

  async get(key: string): Promise<V | undefined> {
    return this.de(await Redis.hGet(this.k(), key));
  }

  async put(key: string, value: V): Promise<void> {
    await Redis.hSet(this.k(), key, this.ser(value));
  }

  async putAll(entries: Record<string, V>): Promise<void> {
    for (const [k, v] of Object.entries(entries)) {
      await this.put(k, v);
    }
  }

  async remove(key: string): Promise<boolean> {
    return (await Redis.hDel(this.k(), key)) > 0;
  }

  async containsKey(key: string): Promise<boolean> {
    return (await Redis.hGet(this.k(), key)) !== undefined;
  }

  async readAllMap(): Promise<Record<string, V>> {
    const all = await Redis.hGetAll(this.k());
    const out: Record<string, V> = {};
    for (const [k, v] of Object.entries(all)) {
      out[k] = this.de(v) as V;
    }
    return out;
  }

  async size(): Promise<number> {
    const client = await Redis.getClient();
    return client.hLen(Redis.key(this.k()));
  }

  async clear(): Promise<void> {
    await Redis.del(this.k());
  }
}

export class RedissonSet implements RSet {
  constructor(readonly name: string) {}

  private k(): string {
    return `set:${this.name}`;
  }

  async add(...members: string[]): Promise<number> {
    return Redis.sAdd(this.k(), ...members);
  }

  async remove(...members: string[]): Promise<number> {
    return Redis.sRem(this.k(), ...members);
  }

  async contains(member: string): Promise<boolean> {
    const client = await Redis.getClient();
    return Number(await client.sIsMember(Redis.key(this.k()), member)) === 1;
  }

  async readAll(): Promise<string[]> {
    return Redis.sMembers(this.k());
  }

  async size(): Promise<number> {
    const client = await Redis.getClient();
    return client.sCard(Redis.key(this.k()));
  }

  async clear(): Promise<void> {
    await Redis.del(this.k());
  }
}

export class RedissonList implements RList {
  constructor(readonly name: string) {}

  private k(): string {
    return `list:${this.name}`;
  }

  async add(...values: string[]): Promise<number> {
    return Redis.rPush(this.k(), ...values);
  }

  async get(index: number): Promise<string | null> {
    const client = await Redis.getClient();
    return client.lIndex(Redis.key(this.k()), index);
  }

  async range(start: number, stop: number): Promise<string[]> {
    return Redis.lRange(this.k(), start, stop);
  }

  async remove(count: number, value: string): Promise<number> {
    const client = await Redis.getClient();
    return client.lRem(Redis.key(this.k()), count, value);
  }

  async size(): Promise<number> {
    return Redis.lLen(this.k());
  }

  async clear(): Promise<void> {
    await Redis.del(this.k());
  }
}

export class RedissonScoredSortedSet implements RScoredSortedSet {
  constructor(readonly name: string) {}

  private k(): string {
    return `zset:${this.name}`;
  }

  async add(score: number, value: string): Promise<boolean> {
    const n = await Redis.zAdd(this.k(), [{ score, value }]);
    return n > 0;
  }

  async addAll(
    members: Array<{ score: number; value: string }>
  ): Promise<number> {
    return Redis.zAdd(this.k(), members);
  }

  async remove(...values: string[]): Promise<number> {
    return Redis.zRem(this.k(), ...values);
  }

  async rank(value: string): Promise<number | null> {
    const client = await Redis.getClient();
    const r = await client.zRank(Redis.key(this.k()), value);
    return r == null ? null : Number(r);
  }

  async score(value: string): Promise<number | null> {
    return Redis.zScore(this.k(), value);
  }

  async valueRange(start: number, stop: number): Promise<string[]> {
    return Redis.zRange(this.k(), start, stop);
  }

  async valueRangeByScore(min: number, max: number): Promise<string[]> {
    return Redis.zRangeByScore(this.k(), min, max);
  }

  async size(): Promise<number> {
    return Redis.zCard(this.k());
  }

  async clear(): Promise<void> {
    await Redis.del(this.k());
  }
}

export class RedissonTopic implements RTopic {
  constructor(readonly name: string) {}

  async publish(message: string): Promise<number> {
    return Redis.publish(this.name, message);
  }

  async addListener(
    listener: (message: string) => void
  ): Promise<() => Promise<void>> {
    return Redis.subscribe(this.name, (msg) => listener(msg));
  }
}

export class RedissonRateLimiter implements RRateLimiter {
  constructor(readonly name: string) {}

  private k(): string {
    return `rrate:${this.name}`;
  }

  async trySetRate(rate: number, rateIntervalMs: number): Promise<boolean> {
    const client = await Redis.getClient();
    const key = Redis.key(this.k());
    const exists = await client.exists(key);
    if (exists) return false;
    await client.hSet(key, {
      rate: String(rate),
      interval: String(rateIntervalMs),
    });
    return true;
  }

  async tryAcquire(permits = 1): Promise<boolean> {
    const client = await Redis.getClient();
    const conf = await client.hmGet(Redis.key(this.k()), ["rate", "interval"]);
    const rate = Number(conf[0] ?? 0);
    const interval = Number(conf[1] ?? 1000);
    if (rate <= 0) return false;
    const ok = await evalNumber(
      RATE_TRY_LUA,
      [Redis.key(this.k())],
      [Date.now(), rate, interval, Math.max(1, permits)]
    );
    return ok === 1;
  }

  async availablePermits(): Promise<number> {
    const client = await Redis.getClient();
    const conf = await client.hmGet(Redis.key(this.k()), ["rate", "interval"]);
    const rate = Number(conf[0] ?? 0);
    const interval = Number(conf[1] ?? 1000);
    if (rate <= 0) return 0;
    const bucket = Redis.key(`${this.k()}:bucket`);
    const now = Date.now();
    await client.zRemRangeByScore(bucket, 0, now - interval);
    const n = await client.zCard(bucket);
    return Math.max(0, rate - Number(n));
  }
}

export class RedissonBitSet implements RBitSet {
  constructor(readonly name: string) {}

  private k(): string {
    return Redis.key(`bitset:${this.name}`);
  }

  async get(bitIndex: number): Promise<boolean> {
    const client = await Redis.getClient();
    return Number(await client.getBit(this.k(), bitIndex)) === 1;
  }

  async set(bitIndex: number, value = true): Promise<boolean> {
    const client = await Redis.getClient();
    const prev = await client.setBit(this.k(), bitIndex, value ? 1 : 0);
    return Number(prev) === 1;
  }

  async clear(bitIndex?: number): Promise<void> {
    if (bitIndex === undefined) {
      await Redis.del(`bitset:${this.name}`);
      return;
    }
    await this.set(bitIndex, false);
  }

  async cardinality(): Promise<number> {
    const client = await Redis.getClient();
    return client.bitCount(this.k());
  }

  async size(): Promise<number> {
    const client = await Redis.getClient();
    return client.strLen(this.k()) * 8;
  }
}

export class RedissonQueue implements RQueue {
  constructor(readonly name: string) {}

  private k(): string {
    return `queue:${this.name}`;
  }

  async offer(...values: string[]): Promise<number> {
    return Redis.rPush(this.k(), ...values);
  }

  async poll(): Promise<string | null> {
    return Redis.lPop(this.k());
  }

  async peek(): Promise<string | null> {
    const arr = await Redis.lRange(this.k(), 0, 0);
    return arr[0] ?? null;
  }

  async size(): Promise<number> {
    return Redis.lLen(this.k());
  }

  async clear(): Promise<void> {
    await Redis.del(this.k());
  }
}
