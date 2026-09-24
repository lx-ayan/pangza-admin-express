import type { Request } from "express";
import Redis from "@/framework/Redis";
import { GuardError } from "./errors";
import {
  RATE_LIMIT_KEY,
  RateLimiterType,
  type RateLimitOption,
} from "./types";

/** 与 Java rate_limiter.lua 一致 */
const RATE_LIMIT_LUA = `
local key=KEYS[1]
local time=tonumber(ARGV[1])
local count=tonumber(ARGV[2])
local current=redis.call('get', key)

if current and tonumber(current)>count then
    return tonumber(current)
end

current = redis.call('incr', key)

if tonumber(current) == 1 then
    redis.call('expire', key, time)
end

return tonumber(current)
`.trim();

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]!.trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }
  return req.socket.remoteAddress || "unknown";
}

function buildRateLimitKey(
  option: RateLimitOption,
  req: Request,
  meta: { controllerName?: string; handlerName?: string }
): string {
  const prefix = option.key ?? RATE_LIMIT_KEY;
  let key = prefix;
  const type = String(option.type ?? RateLimiterType.DEFAULT);
  if (type === RateLimiterType.IP || type === "IP") {
    key += `${clientIp(req)}-`;
  }
  const controller = meta.controllerName || "Anonymous";
  const handler = meta.handlerName || req.path;
  key += `${controller}-${handler}`;
  return key;
}

/**
 * 接口限流（对齐 Java RateLimiterAspect）
 */
export async function applyRateLimit(
  option: RateLimitOption | undefined,
  req: Request,
  meta: { controllerName?: string; handlerName?: string } = {}
): Promise<void> {
  if (!option) return;

  const time = option.time ?? 2;
  const count = option.count ?? 1;
  const redisKey = Redis.key(buildRateLimitKey(option, req, meta));
  const client = await Redis.getClient();

  const result = (await client.eval(RATE_LIMIT_LUA, {
    keys: [redisKey],
    arguments: [String(time), String(count)],
  })) as number | null;

  if (result == null || Number(result) > count) {
    throw new GuardError("访问过于频繁，请稍后重试");
  }
}
