import { createHash } from "crypto";
import type { Request } from "express";
import Redis from "./Redis";
import { getClientIp } from "@/framework/Log/ip";
import { AuthUtil } from "@/framework/Auth";
import { GuardError } from "./errors";
import {
  RATE_LIMIT_KEY,
  REPEAT_SUBMIT_KEY,
  RateLimiterType,
  type RateLimitOption,
  type RepeatSubmitOption,
} from "./types";

async function buildRateLimitKey(
  option: RateLimitOption,
  req: Request,
  meta: { controllerName?: string; handlerName?: string }
): Promise<string> {
  const prefix = option.key ?? RATE_LIMIT_KEY;
  let key = prefix;
  const type = String(option.type ?? RateLimiterType.DEFAULT);
  if (type === RateLimiterType.IP || type === "IP") {
    key += `${getClientIp(req)}-`;
  } else if (type === RateLimiterType.USER || type === "USER") {
    const loginId =
      (await AuthUtil.getLoginIdDefaultNull()) ?? "anonymous";
    key += `${loginId}-`;
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
  const key = await buildRateLimitKey(option, req, meta);
  const mode = option.mode ?? "fixed";
  const current =
    mode === "sliding"
      ? await Redis.rateLimitSliding(key, time, count)
      : await Redis.rateLimit(key, time, count);

  if (current > count) {
    throw new GuardError("访问过于频繁，请稍后重试");
  }
}

function serializeParams(req: Request): string {
  const body = req.body;
  if (body != null && typeof body === "object") {
    const keys = Object.keys(body as object);
    if (keys.length > 0) {
      try {
        return JSON.stringify(body);
      } catch {
        // fallthrough
      }
    }
  }
  try {
    return JSON.stringify(req.query ?? {});
  } catch {
    return "";
  }
}

function hashParams(raw: string): string {
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

async function buildRepeatBaseKey(req: Request): Promise<string> {
  const loginId =
    (await AuthUtil.getLoginIdDefaultNull()) ?? "anonymous";
  return `${REPEAT_SUBMIT_KEY}${req.originalUrl || req.url || req.path}:${loginId}`;
}

/**
 * 防重复提交（对齐 Java RepeatSubmitInterceptor）。
 * 用 SET NX PX 原子占坑：同 URL + 用户 + 参数指纹在 interval 内只能成功一次，无竞态。
 */
export async function applyRepeatSubmit(
  option: RepeatSubmitOption | undefined,
  req: Request
): Promise<void> {
  if (!option) return;

  const interval = option.interval ?? 3000;
  const message = option.message ?? "请勿重复提交";
  const fingerprint = hashParams(serializeParams(req));
  const key = `${await buildRepeatBaseKey(req)}:${fingerprint}`;

  const ok = await Redis.setNxPx(key, "1", Math.max(1, interval));
  if (!ok) {
    throw new GuardError(message);
  }
}
