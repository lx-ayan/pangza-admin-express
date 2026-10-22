export { default } from "./Redis";
export type {
  RedisConfig,
  RedisTlsConfig,
  RedisMode,
  RedisClusterConfig,
  RedisSentinelConfig,
  RedisNodeEndpoint,
  RateLimitOption,
  RateLimitMode,
  RepeatSubmitOption,
  RateLimiterTypeValue,
  CacheableOption,
  CacheEvictOption,
  TryLockOption,
  WithLockOption,
  LockHandle,
} from "./types";
export {
  RateLimiterType,
  RATE_LIMIT_KEY,
  REPEAT_SUBMIT_KEY,
  CACHE_KEY,
  LOCK_KEY,
} from "./types";
export { GuardError, LockError } from "./errors";
export { applyRateLimit, applyRepeatSubmit } from "./rateLimit";
export { RateLimiter, RepeatSubmit, Cacheable, CacheEvict } from "./decorators";

/** Redisson 风格分布式锁 / 同步器 / 对象 */
export {
  Redisson,
  createRedisson,
  RedissonLock,
  createFairLock,
  RedissonReadWriteLock,
  RedissonMultiLock,
  RedissonSemaphore,
  RedissonCountDownLatch,
  defaultRedissonConfig,
} from "./redisson";
export type {
  RedissonClient,
  RedissonConfig,
  RLock,
  RReadWriteLock,
  RSemaphore,
  RCountDownLatch,
  RAtomicLong,
  RBucket,
  RMap,
  RSet,
  RList,
  RScoredSortedSet,
  RTopic,
  RRateLimiter,
  RBitSet,
  RQueue,
} from "./redisson";
