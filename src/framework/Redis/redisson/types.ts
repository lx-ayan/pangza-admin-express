/** Redisson 风格客户端配置 */
export interface RedissonConfig {
  /** 看门狗默认租约（毫秒），默认 30000；lock() 未指定 lease 时启用续期 */
  lockWatchdogTimeout?: number;
  /** 自旋等待最小间隔（毫秒），默认 50 */
  lockWatchInterval?: number;
}

export const defaultRedissonConfig: Required<RedissonConfig> = {
  lockWatchdogTimeout: 30_000,
  lockWatchInterval: 50,
};

export interface RLock {
  readonly name: string;
  /** 阻塞加锁；leaseTimeMs 省略则启用看门狗 */
  lock(leaseTimeMs?: number): Promise<void>;
  /**
   * 尝试加锁。
   * - tryLock() 立即返回
   * - tryLock(waitMs) 等待至多 waitMs，看门狗续期
   * - tryLock(waitMs, leaseMs) 等待 waitMs，固定租约不看门狗
   */
  tryLock(waitTimeMs?: number, leaseTimeMs?: number): Promise<boolean>;
  unlock(): Promise<void>;
  forceUnlock(): Promise<boolean>;
  isLocked(): Promise<boolean>;
  isHeldByCurrentThread(): Promise<boolean>;
  getHoldCount(): Promise<number>;
  remainTimeToLive(): Promise<number>;
}

export interface RReadWriteLock {
  readLock(): RLock;
  writeLock(): RLock;
}

export interface RSemaphore {
  readonly name: string;
  trySetPermits(permits: number): Promise<boolean>;
  acquire(permits?: number): Promise<void>;
  tryAcquire(permits?: number, waitTimeMs?: number): Promise<boolean>;
  release(permits?: number): Promise<void>;
  availablePermits(): Promise<number>;
}

export interface RCountDownLatch {
  readonly name: string;
  trySetCount(count: number): Promise<boolean>;
  countDown(): Promise<void>;
  await(waitTimeMs?: number): Promise<boolean>;
  getCount(): Promise<number>;
}

export interface RAtomicLong {
  readonly name: string;
  get(): Promise<number>;
  set(value: number): Promise<void>;
  getAndSet(value: number): Promise<number>;
  incrementAndGet(): Promise<number>;
  decrementAndGet(): Promise<number>;
  addAndGet(delta: number): Promise<number>;
  compareAndSet(expect: number, update: number): Promise<boolean>;
  delete(): Promise<boolean>;
}

export interface RBucket<T = unknown> {
  readonly name: string;
  get(): Promise<T | null>;
  set(value: T, ttlSeconds?: number): Promise<void>;
  getAndDelete(): Promise<T | null>;
  compareAndSet(expect: T, update: T): Promise<boolean>;
  trySet(value: T, ttlSeconds?: number): Promise<boolean>;
  delete(): Promise<boolean>;
  isExists(): Promise<boolean>;
  expire(ttlSeconds: number): Promise<boolean>;
}

export interface RMap<V = string> {
  readonly name: string;
  get(key: string): Promise<V | undefined>;
  put(key: string, value: V): Promise<void>;
  putAll(entries: Record<string, V>): Promise<void>;
  remove(key: string): Promise<boolean>;
  containsKey(key: string): Promise<boolean>;
  readAllMap(): Promise<Record<string, V>>;
  size(): Promise<number>;
  clear(): Promise<void>;
}

export interface RSet {
  readonly name: string;
  add(...members: string[]): Promise<number>;
  remove(...members: string[]): Promise<number>;
  contains(member: string): Promise<boolean>;
  readAll(): Promise<string[]>;
  size(): Promise<number>;
  clear(): Promise<void>;
}

export interface RList {
  readonly name: string;
  add(...values: string[]): Promise<number>;
  get(index: number): Promise<string | null>;
  range(start: number, stop: number): Promise<string[]>;
  remove(count: number, value: string): Promise<number>;
  size(): Promise<number>;
  clear(): Promise<void>;
}

export interface RScoredSortedSet {
  readonly name: string;
  add(score: number, value: string): Promise<boolean>;
  addAll(members: Array<{ score: number; value: string }>): Promise<number>;
  remove(...values: string[]): Promise<number>;
  rank(value: string): Promise<number | null>;
  score(value: string): Promise<number | null>;
  valueRange(start: number, stop: number): Promise<string[]>;
  valueRangeByScore(min: number, max: number): Promise<string[]>;
  size(): Promise<number>;
  clear(): Promise<void>;
}

export interface RTopic {
  readonly name: string;
  publish(message: string): Promise<number>;
  addListener(listener: (message: string) => void): Promise<() => Promise<void>>;
}

export interface RRateLimiter {
  readonly name: string;
  trySetRate(rate: number, rateIntervalMs: number): Promise<boolean>;
  tryAcquire(permits?: number): Promise<boolean>;
  /** 当前窗口剩余许可（近似） */
  availablePermits(): Promise<number>;
}

export interface RBitSet {
  readonly name: string;
  get(bitIndex: number): Promise<boolean>;
  set(bitIndex: number, value?: boolean): Promise<boolean>;
  clear(bitIndex?: number): Promise<void>;
  cardinality(): Promise<number>;
  size(): Promise<number>;
}

export interface RQueue {
  readonly name: string;
  offer(...values: string[]): Promise<number>;
  poll(): Promise<string | null>;
  peek(): Promise<string | null>;
  size(): Promise<number>;
  clear(): Promise<void>;
}
