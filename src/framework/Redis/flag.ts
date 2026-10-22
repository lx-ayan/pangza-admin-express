/** Redis 模块标记：Application.registry(EnableRedis()) 识别 */
export const REDIS_MODULE_FLAG = Symbol.for("pangza.redis.module");

let redisEnabled = false;

export function markRedisEnabled(enabled = true): void {
  redisEnabled = enabled;
}

export function isRedisEnabled(): boolean {
  return redisEnabled;
}
