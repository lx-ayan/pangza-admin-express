import type { NextFunction, Request, Response } from "express";
import Redis from "./Redis";
import { REDIS_MODULE_FLAG, markRedisEnabled } from "./flag";
import type { RedisConfig } from "./types";

/**
 * 显式启用 Redis：预热 / 连接校验仅在 registry 后执行。
 * 未 registry 时不会在启动阶段连 Redis，避免无 Redis 用户被报错刷屏。
 *
 * @example
 * Application.registry(EnableRedis()).start();
 * Application.registry(EnableRedis({ host: "127.0.0.1", port: 6379 })).start();
 */
export function EnableRedis(config?: RedisConfig) {
  if (config) Redis.configure(config);
  markRedisEnabled(true);

  const middleware = (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };

  Object.defineProperty(middleware, REDIS_MODULE_FLAG, {
    value: true,
    enumerable: false,
  });

  return middleware;
}
