import { randomBytes } from "crypto";
import { createFairLock } from "./RFairLock";
import { RedissonLock } from "./RLock";
import { RedissonMultiLock } from "./RMultiLock";
import { RedissonReadWriteLock } from "./RReadWriteLock";
import { RedissonCountDownLatch } from "./RCountDownLatch";
import { RedissonSemaphore } from "./RSemaphore";
import {
  RedissonAtomicLong,
  RedissonBitSet,
  RedissonBucket,
  RedissonList,
  RedissonMap,
  RedissonQueue,
  RedissonRateLimiter,
  RedissonScoredSortedSet,
  RedissonSet,
  RedissonTopic,
} from "./objects";
import type {
  RAtomicLong,
  RBitSet,
  RBucket,
  RCountDownLatch,
  RList,
  RLock,
  RMap,
  RQueue,
  RRateLimiter,
  RReadWriteLock,
  RScoredSortedSet,
  RSemaphore,
  RSet,
  RTopic,
  RedissonConfig,
} from "./types";
import { defaultRedissonConfig } from "./types";
import { createClientId } from "./utils";

/**
 * Redisson 风格门面（基于现有 Redis 连接）。
 *
 * @example
 *   const lock = Redisson.getLock('order:pay');
 *   await lock.lock();
 *   try { ... } finally { await lock.unlock(); }
 */
class RedissonClient {
  private readonly clientId: string;
  private config: Required<RedissonConfig>;

  constructor(config: RedissonConfig = {}) {
    this.clientId = createClientId();
    this.config = { ...defaultRedissonConfig, ...config };
  }

  /** 覆盖看门狗等配置 */
  configure(config: RedissonConfig): void {
    this.config = { ...this.config, ...config };
  }

  getClientId(): string {
    return this.clientId;
  }

  // ─── Locks ───────────────────────────────────────────────────

  getLock(name: string): RLock {
    return new RedissonLock(name, this.clientId, this.config);
  }

  getFairLock(name: string): RLock {
    return createFairLock(name, this.clientId, this.config);
  }

  getReadWriteLock(name: string): RReadWriteLock {
    return new RedissonReadWriteLock(name, this.clientId, this.config);
  }

  getMultiLock(...locks: RLock[]): RLock {
    return new RedissonMultiLock(locks);
  }

  // ─── Synchronizers ───────────────────────────────────────────

  getSemaphore(name: string): RSemaphore {
    return new RedissonSemaphore(name);
  }

  getCountDownLatch(name: string): RCountDownLatch {
    return new RedissonCountDownLatch(name);
  }

  // ─── Objects ─────────────────────────────────────────────────

  getAtomicLong(name: string): RAtomicLong {
    return new RedissonAtomicLong(name);
  }

  getBucket<T = unknown>(name: string): RBucket<T> {
    return new RedissonBucket<T>(name);
  }

  getMap<V = string>(name: string): RMap<V> {
    return new RedissonMap<V>(name);
  }

  getSet(name: string): RSet {
    return new RedissonSet(name);
  }

  getList(name: string): RList {
    return new RedissonList(name);
  }

  getScoredSortedSet(name: string): RScoredSortedSet {
    return new RedissonScoredSortedSet(name);
  }

  getTopic(name: string): RTopic {
    return new RedissonTopic(name);
  }

  getRateLimiter(name: string): RRateLimiter {
    return new RedissonRateLimiter(name);
  }

  getBitSet(name: string): RBitSet {
    return new RedissonBitSet(name);
  }

  getQueue(name: string): RQueue {
    return new RedissonQueue(name);
  }

  /**
   * 持锁执行（看门狗）；等价于 getLock + lock + unlock。
   */
  async withLock<T>(
    name: string,
    fn: () => Promise<T> | T,
    leaseTimeMs?: number
  ): Promise<T> {
    const lock = this.getLock(name);
    await lock.lock(leaseTimeMs);
    try {
      return await fn();
    } finally {
      await lock.unlock();
    }
  }
}

/** 默认单例（进程级 clientId） */
export const Redisson = new RedissonClient();

/** 创建独立客户端（不同 clientId，用于测试或多实例语义） */
export function createRedisson(config?: RedissonConfig): RedissonClient {
  return new RedissonClient(config);
}

export type { RedissonClient };

/** 生成随机 token（测试辅助） */
export function randomLockToken(): string {
  return randomBytes(8).toString("hex");
}
