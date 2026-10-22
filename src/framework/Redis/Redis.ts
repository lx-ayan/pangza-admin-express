import fs from "fs";
import { randomBytes } from "crypto";
import {
  createClient,
  createCluster,
  createSentinel,
} from "redis";
import { configProfile, redisConfig } from "@/framework/config";
import {
  defaultRedisConfig,
  LOCK_KEY,
  type LockHandle,
  type RedisConfig,
  type TryLockOption,
  type WithLockOption,
} from "./types";
import { LockError } from "./errors";

function readOptionalFile(path?: string): string | undefined {
  const p = path?.trim();
  if (!p) return undefined;
  try {
    return fs.readFileSync(p, "utf8");
  } catch (err) {
    console.warn(
      `[Redis] 无法读取 TLS 文件 ${p}:`,
      err instanceof Error ? err.message : err
    );
    return undefined;
  }
}

function buildReconnectStrategy(cfg: RedisConfig) {
  const reconnect = cfg.reconnect !== false;
  const maxDelay =
    cfg.maxReconnectDelay ?? defaultRedisConfig.maxReconnectDelay;
  if (!reconnect) return false;
  return (retries: number) => {
    if (retries > 20) {
      console.error("[Redis] 重连次数过多，停止重连");
      return new Error("Redis reconnect gave up");
    }
    return Math.min(maxDelay, 100 * Math.pow(2, retries));
  };
}

function buildSocketBase(cfg: RedisConfig, host: string, port: number) {
  const socket: Record<string, unknown> = {
    host,
    port,
    connectTimeout: cfg.connectTimeout ?? defaultRedisConfig.connectTimeout,
    reconnectStrategy: buildReconnectStrategy(cfg),
  };
  if (cfg.tls?.enabled) {
    socket.tls = true;
    socket.rejectUnauthorized = cfg.tls.rejectUnauthorized !== false;
    const ca = readOptionalFile(cfg.tls.ca);
    const cert = readOptionalFile(cfg.tls.cert);
    const key = readOptionalFile(cfg.tls.key);
    if (ca) socket.ca = ca;
    if (cert) socket.cert = cert;
    if (key) socket.key = key;
  }
  return socket;
}

function authFields(cfg: RedisConfig) {
  const username = cfg.username?.trim();
  const password = cfg.password?.trim();
  return {
    username: username || undefined,
    password: password || undefined,
  };
}

/** 创建 RESP2 客户端（standalone / cluster / sentinel） */
function createRedisClient(cfg: RedisConfig): any {
  const mode = cfg.mode ?? "standalone";
  const auth = authFields(cfg);
  const RESP = 2 as const;

  if (mode === "cluster") {
    const nodes = cfg.cluster?.nodes?.filter((n) => n?.host?.trim()) ?? [];
    if (nodes.length === 0) {
      throw new Error(
        "Redis mode=cluster 时请配置 redis.cluster.nodes（至少一个种子节点）"
      );
    }
    return createCluster({
      RESP,
      rootNodes: nodes.map((n) => ({
        socket: buildSocketBase(cfg, n.host, n.port ?? 6379) as any,
      })),
      defaults: {
        ...auth,
        socket: buildSocketBase(
          cfg,
          nodes[0]!.host,
          nodes[0]!.port ?? 6379
        ) as any,
      },
      useReplicas: cfg.cluster?.useReplicas === true,
    });
  }

  if (mode === "sentinel") {
    const name = cfg.sentinel?.name?.trim();
    const nodes = cfg.sentinel?.nodes?.filter((n) => n?.host?.trim()) ?? [];
    if (!name || nodes.length === 0) {
      throw new Error(
        "Redis mode=sentinel 时请配置 redis.sentinel.name 与 redis.sentinel.nodes"
      );
    }
    return createSentinel({
      RESP,
      name,
      sentinelRootNodes: nodes.map((n) => ({
        host: n.host,
        port: n.port ?? 26379,
      })),
      nodeClientOptions: {
        ...auth,
        socket: buildSocketBase(
          cfg,
          cfg.host ?? defaultRedisConfig.host,
          cfg.port ?? defaultRedisConfig.port
        ) as any,
      },
      sentinelClientOptions: {
        ...auth,
      },
    });
  }

  const host = cfg.host ?? defaultRedisConfig.host;
  const port = cfg.port ?? defaultRedisConfig.port;
  return createClient({
    RESP,
    socket: buildSocketBase(cfg, host, port) as any,
    ...auth,
    database: cfg.db ?? defaultRedisConfig.db,
  });
}

type RedisClient = ReturnType<typeof createRedisClient>;

/**
 * 固定窗口限流：INCR 后若尚无 TTL 则设置 expire。
 */
const RATE_LIMIT_LUA = `
local key=KEYS[1]
local time=tonumber(ARGV[1])
local count=tonumber(ARGV[2])
local current=redis.call('get', key)

if current and tonumber(current)>count then
    return tonumber(current)
end

current = redis.call('incr', key)
local ttl = redis.call('pttl', key)
if ttl < 0 then
    redis.call('expire', key, time)
end

return tonumber(current)
`.trim();

/**
 * 滑动窗口限流（ZSET）：清理窗口外成员后计数，未超限则 ZADD。
 * 返回当前窗口内数量（含本次）；调用方判断 > count 则拒绝。
 */
const SLIDING_RATE_LIMIT_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local n = redis.call('ZCARD', key)
if n >= limit then
  return n + 1
end
redis.call('ZADD', key, now, now .. '-' .. ARGV[4])
redis.call('PEXPIRE', key, window)
return n + 1
`.trim();

/** 仅当 value 匹配时删除（安全解锁） */
const UNLOCK_IF_MATCH_LUA = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
end
return 0
`.trim();

/** 仅当 value 匹配时续期 */
const RENEW_IF_MATCH_LUA = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('pexpire', KEYS[1], tonumber(ARGV[2]))
end
return 0
`.trim();

function randomToken(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Redis 操作封装（基于 node-redis v6）。
 * 配置来自项目根目录 application*.yaml，模块加载及首次调用时自动连接。
 */
class Redis {
  private static client: RedisClient | null = null;
  private static config: RedisConfig = {
    ...defaultRedisConfig,
    ...redisConfig,
  };
  private static connecting: Promise<void> | null = null;
  /** Pub/Sub 专用连接（subscribe 会阻塞普通命令） */
  private static subClient: RedisClient | null = null;

  private static async ensureReady(): Promise<RedisClient> {
    if (!this.client?.isReady) {
      await this.connect();
    }
    if (!this.client?.isReady) {
      throw new Error("Redis 连接不可用，请检查 YAML 中的 redis 配置");
    }
    return this.client;
  }

  /** 覆盖配置；已连接时需 disconnect 后再 connect 才生效 */
  static configure(config: RedisConfig = {}): void {
    this.config = {
      ...defaultRedisConfig,
      ...this.config,
      ...config,
      tls: {
        ...this.config.tls,
        ...config.tls,
      },
      cluster: {
        ...this.config.cluster,
        ...config.cluster,
      },
      sentinel: {
        ...this.config.sentinel,
        ...config.sentinel,
      },
    };
  }

  static isReady(): boolean {
    return !!this.client?.isReady;
  }

  /** PING；成功返回 true，失败抛错或返回 false（ping 自身异常时） */
  static async ping(): Promise<boolean> {
    const client = await this.ensureReady();
    const res = await client.ping();
    return res === "PONG" || res === true || res === "OK";
  }

  static async connect(config?: RedisConfig): Promise<void> {
    if (config) this.configure(config);
    if (this.client?.isReady) return;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      const cfg: RedisConfig = {
        ...defaultRedisConfig,
        ...this.config,
      };

      const pwd = String(cfg.password ?? "").trim();
      if (!pwd) {
        const production = configProfile === "production";
        const msg =
          "[Redis] 未配置 password：仅建议本机开发使用；生产请设置 redis.password，并限制网络访问";
        if (production) {
          console.error(msg);
        } else {
          console.warn(msg);
        }
      }

      if (this.client) {
        try {
          await this.client.quit();
        } catch {
          try {
            this.client.destroy();
          } catch {
            // ignore
          }
        }
        this.client = null;
      }
      if (this.subClient) {
        try {
          await this.subClient.quit();
        } catch {
          try {
            this.subClient.destroy();
          } catch {
            // ignore
          }
        }
        this.subClient = null;
      }

      const client = createRedisClient(cfg);

      client.on("error", (err: Error) => {
        console.error("[Redis] error:", err.message);
      });
      client.on("reconnecting", () => {
        console.warn("[Redis] reconnecting...");
      });

      await client.connect();
      this.client = client;
      const mode = cfg.mode ?? "standalone";
      const tlsTag = cfg.tls?.enabled ? " tls" : "";
      if (mode === "cluster") {
        console.log(`[Redis] 已连接 cluster${tlsTag}`);
      } else if (mode === "sentinel") {
        console.log(
          `[Redis] 已连接 sentinel name=${cfg.sentinel?.name ?? ""}${tlsTag}`
        );
      } else {
        console.log(
          `[Redis] 已连接 ${cfg.host}:${cfg.port} db=${cfg.db ?? 0}${tlsTag}`
        );
      }
    })();

    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  static async disconnect(): Promise<void> {
    const close = async (c: RedisClient | null) => {
      if (!c) return;
      try {
        await c.quit();
      } catch {
        try {
          c.destroy();
        } catch {
          // ignore
        }
      }
    };
    const main = this.client;
    const sub = this.subClient;
    this.client = null;
    this.subClient = null;
    await close(main);
    await close(sub);
  }

  static async getClient(): Promise<RedisClient> {
    return this.ensureReady();
  }

  static key(raw: string): string {
    const prefix = this.config.keyPrefix ?? defaultRedisConfig.keyPrefix;
    return raw.startsWith(prefix) ? raw : `${prefix}${raw}`;
  }

  // ─── String / JSON ───────────────────────────────────────────

  static async set(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<void> {
    const client = await this.ensureReady();
    const k = this.key(key);
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(k, value, { EX: ttlSeconds });
    } else {
      await client.set(k, value);
    }
  }

  static async setJSON(
    key: string,
    value: unknown,
    ttlSeconds?: number
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  static async get(key: string): Promise<string | null> {
    const client = await this.ensureReady();
    return client.get(this.key(key));
  }

  static async getJSON<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  static async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    const client = await this.ensureReady();
    return client.del(keys.map((k) => this.key(k)));
  }

  static async exists(key: string): Promise<boolean> {
    const client = await this.ensureReady();
    const n = await client.exists(this.key(key));
    return n > 0;
  }

  static async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const client = await this.ensureReady();
    const result = await client.expire(this.key(key), ttlSeconds);
    return Number(result) === 1;
  }

  static async ttl(key: string): Promise<number> {
    const client = await this.ensureReady();
    return client.ttl(this.key(key));
  }

  static async setNX(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<boolean> {
    const client = await this.ensureReady();
    const k = this.key(key);
    const result = await client.set(k, value, {
      NX: true,
      ...(ttlSeconds && ttlSeconds > 0 ? { EX: ttlSeconds } : {}),
    });
    return result === "OK";
  }

  static async setNxPx(
    key: string,
    value: string,
    ttlMs: number
  ): Promise<boolean> {
    const client = await this.ensureReady();
    const result = await client.set(this.key(key), value, {
      NX: true,
      PX: Math.max(1, ttlMs),
    });
    return result === "OK";
  }

  static async unlockIfMatch(
    key: string,
    expectValue: string
  ): Promise<boolean> {
    const client = await this.ensureReady();
    const result = (await client.eval(UNLOCK_IF_MATCH_LUA, {
      keys: [this.key(key)],
      arguments: [expectValue],
    })) as number;
    return Number(result) === 1;
  }

  /** 值匹配时续期（毫秒） */
  static async renewIfMatch(
    key: string,
    expectValue: string,
    ttlMs: number
  ): Promise<boolean> {
    const client = await this.ensureReady();
    const result = (await client.eval(RENEW_IF_MATCH_LUA, {
      keys: [this.key(key)],
      arguments: [expectValue, String(Math.max(1, ttlMs))],
    })) as number;
    return Number(result) === 1;
  }

  /**
   * 尝试获取锁。
   * @returns 句柄；失败返回 null
   */
  static async tryLock(
    key: string,
    option: TryLockOption = {}
  ): Promise<LockHandle | null> {
    const ttlMs = option.ttlMs ?? 30_000;
    const token = option.token ?? randomToken();
    const lockKey = key.startsWith(LOCK_KEY) ? key : `${LOCK_KEY}${key}`;
    const ok = await this.setNxPx(lockKey, token, ttlMs);
    if (!ok) return null;
    return {
      key: lockKey,
      token,
      release: () => this.unlockIfMatch(lockKey, token),
      renew: (ms) => this.renewIfMatch(lockKey, token, ms),
    };
  }

  /**
   * 持锁执行；可选自动续租。拿不到锁抛 LockError。
   */
  static async withLock<T>(
    key: string,
    fn: () => Promise<T> | T,
    option: WithLockOption = {}
  ): Promise<T> {
    const ttlMs = option.ttlMs ?? 30_000;
    const handle = await this.tryLock(key, { ttlMs, token: option.token });
    if (!handle) {
      throw new LockError(`获取锁失败: ${key}`);
    }
    const renewEvery =
      option.renewIntervalMs === undefined
        ? Math.max(100, Math.floor(ttlMs / 3))
        : option.renewIntervalMs;
    let timer: ReturnType<typeof setInterval> | null = null;
    if (renewEvery > 0) {
      timer = setInterval(() => {
        void handle.renew(ttlMs).catch(() => {
          // 续租失败忽略；业务侧应尽量短持锁
        });
      }, renewEvery);
      if (typeof timer === "object" && "unref" in timer) {
        (timer as NodeJS.Timeout).unref?.();
      }
    }
    try {
      return await fn();
    } finally {
      if (timer) clearInterval(timer);
      await handle.release();
    }
  }

  // ─── Hash ────────────────────────────────────────────────────

  static async hSet(
    key: string,
    field: string,
    value: string
  ): Promise<number> {
    const client = await this.ensureReady();
    return client.hSet(this.key(key), field, value);
  }

  static async hGet(key: string, field: string): Promise<string | undefined> {
    const client = await this.ensureReady();
    const v = await client.hGet(this.key(key), field);
    return v ?? undefined;
  }

  static async hGetAll(key: string): Promise<Record<string, string>> {
    const client = await this.ensureReady();
    return client.hGetAll(this.key(key));
  }

  static async hDel(key: string, ...fields: string[]): Promise<number> {
    if (fields.length === 0) return 0;
    const client = await this.ensureReady();
    return client.hDel(this.key(key), fields);
  }

  // ─── Set ─────────────────────────────────────────────────────

  static async sAdd(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    const client = await this.ensureReady();
    return client.sAdd(this.key(key), members);
  }

  static async sMembers(key: string): Promise<string[]> {
    const client = await this.ensureReady();
    return client.sMembers(this.key(key));
  }

  static async sRem(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    const client = await this.ensureReady();
    return client.sRem(this.key(key), members);
  }

  // ─── List ────────────────────────────────────────────────────

  static async lPush(key: string, ...values: string[]): Promise<number> {
    if (values.length === 0) return 0;
    const client = await this.ensureReady();
    return client.lPush(this.key(key), values);
  }

  static async rPush(key: string, ...values: string[]): Promise<number> {
    if (values.length === 0) return 0;
    const client = await this.ensureReady();
    return client.rPush(this.key(key), values);
  }

  static async lPop(key: string): Promise<string | null> {
    const client = await this.ensureReady();
    return client.lPop(this.key(key));
  }

  static async rPop(key: string): Promise<string | null> {
    const client = await this.ensureReady();
    return client.rPop(this.key(key));
  }

  static async lRange(
    key: string,
    start: number,
    stop: number
  ): Promise<string[]> {
    const client = await this.ensureReady();
    return client.lRange(this.key(key), start, stop);
  }

  static async lLen(key: string): Promise<number> {
    const client = await this.ensureReady();
    return client.lLen(this.key(key));
  }

  // ─── ZSet ────────────────────────────────────────────────────

  static async zAdd(
    key: string,
    members: Array<{ score: number; value: string }>
  ): Promise<number> {
    if (members.length === 0) return 0;
    const client = await this.ensureReady();
    return client.zAdd(
      this.key(key),
      members.map((m) => ({ score: m.score, value: m.value }))
    );
  }

  static async zRange(
    key: string,
    min: number,
    max: number
  ): Promise<string[]> {
    const client = await this.ensureReady();
    return client.zRange(this.key(key), min, max);
  }

  static async zRangeByScore(
    key: string,
    min: number | string,
    max: number | string
  ): Promise<string[]> {
    const client = await this.ensureReady();
    return client.zRangeByScore(this.key(key), min, max);
  }

  static async zRem(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    const client = await this.ensureReady();
    return client.zRem(this.key(key), members);
  }

  static async zCard(key: string): Promise<number> {
    const client = await this.ensureReady();
    return client.zCard(this.key(key));
  }

  static async zScore(key: string, member: string): Promise<number | null> {
    const client = await this.ensureReady();
    const s = await client.zScore(this.key(key), member);
    return s == null ? null : Number(s);
  }

  // ─── Pipeline ────────────────────────────────────────────────

  /**
   * 批量命令。fn 内对 multi 链式调用，结束后自动 exec。
   * key 需自行 `Redis.key(...)` 加前缀。
   */
  static async pipeline(
    fn: (multi: ReturnType<RedisClient["multi"]>) => void
  ): Promise<unknown[]> {
    const client = await this.ensureReady();
    const multi = client.multi();
    fn(multi);
    return (await multi.exec()) as unknown[];
  }

  // ─── Pub/Sub ─────────────────────────────────────────────────

  static async publish(channel: string, message: string): Promise<number> {
    const client = await this.ensureReady();
    return client.publish(channel, message);
  }

  /**
   * 订阅频道。返回取消订阅函数。
   * 内部使用独立连接，避免阻塞主 client。
   */
  static async subscribe(
    channel: string,
    listener: (message: string, channel: string) => void
  ): Promise<() => Promise<void>> {
    await this.ensureReady();
    if (!this.subClient?.isReady) {
      const cfg: RedisConfig = { ...defaultRedisConfig, ...this.config };
      const sub = createRedisClient(cfg);
      sub.on("error", (err: Error) => {
        console.error("[Redis] sub error:", err.message);
      });
      await sub.connect();
      this.subClient = sub;
    }
    const sub = this.subClient!;
    await sub.subscribe(channel, (message: string, ch: string) => {
      listener(message, ch);
    });
    return async () => {
      try {
        await sub.unsubscribe(channel);
      } catch {
        // ignore
      }
    };
  }

  // ─── Counter / PX ────────────────────────────────────────────

  static async incr(key: string): Promise<number> {
    const client = await this.ensureReady();
    return client.incr(this.key(key));
  }

  static async decr(key: string): Promise<number> {
    const client = await this.ensureReady();
    return client.decr(this.key(key));
  }

  static async setPx(
    key: string,
    value: string,
    ttlMs: number
  ): Promise<void> {
    const client = await this.ensureReady();
    await client.set(this.key(key), value, { PX: Math.max(1, ttlMs) });
  }

  static async setJSONPx(
    key: string,
    value: unknown,
    ttlMs: number
  ): Promise<void> {
    await this.setPx(key, JSON.stringify(value), ttlMs);
  }

  /**
   * 固定窗口限流。
   * @returns 当前窗口内计数
   */
  static async rateLimit(
    key: string,
    timeSeconds: number,
    count: number
  ): Promise<number> {
    const client = await this.ensureReady();
    const result = (await client.eval(RATE_LIMIT_LUA, {
      keys: [this.key(key)],
      arguments: [String(timeSeconds), String(count)],
    })) as number | null;
    return Number(result ?? 0);
  }

  /**
   * 滑动窗口限流（ZSET）。
   * @returns 当前窗口内数量（含本次尝试）
   */
  static async rateLimitSliding(
    key: string,
    timeSeconds: number,
    count: number
  ): Promise<number> {
    const client = await this.ensureReady();
    const now = Date.now();
    const windowMs = Math.max(1, Math.floor(timeSeconds * 1000));
    const result = (await client.eval(SLIDING_RATE_LIMIT_LUA, {
      keys: [this.key(key)],
      arguments: [
        String(now),
        String(windowMs),
        String(count),
        randomToken().slice(0, 8),
      ],
    })) as number | null;
    return Number(result ?? 0);
  }

  /** 按前缀扫描删除（@CacheEvict allEntries）；小规模缓存用 */
  static async deleteByPrefix(prefix: string): Promise<number> {
    const client = await this.ensureReady();
    const full = this.key(prefix);
    let cursor = "0";
    let removed = 0;
    do {
      const reply = await client.scan(cursor, {
        MATCH: `${full}*`,
        COUNT: 100,
      });
      cursor = String(reply.cursor);
      const keys = reply.keys as string[];
      if (keys.length) {
        removed += await client.del(keys);
      }
    } while (cursor !== "0");
    return removed;
  }
}

// 不在 import 时连 Redis：避免启动被连接超时拖慢；首次 API 调用走 ensureReady()

export default Redis;
