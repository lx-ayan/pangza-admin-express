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

function buildRateLimitKey(
  option: RateLimitOption,
  req: Request,
  meta: { controllerName?: string; handlerName?: string }
): string {
  const prefix = option.key ?? RATE_LIMIT_KEY;
  let key = prefix;
  const type = String(option.type ?? RateLimiterType.DEFAULT);
  if (type === RateLimiterType.IP || type === "IP") {
    key += `${getClientIp(req)}-`;
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
  const current = await Redis.rateLimit(
    buildRateLimitKey(option, req, meta),
    time,
    count
  );

  if (current > count) {
    throw new GuardError("访问过于频繁，请稍后重试");
  }
}

const REPEAT_PARAM = "repeat_param";
const REPEAT_TIME = "repeat_time";

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

async function buildRepeatKey(req: Request): Promise<string> {
  const loginId =
    (await AuthUtil.getLoginIdDefaultNull()) ?? "anonymous";
  return `${REPEAT_SUBMIT_KEY}${req.originalUrl || req.url || req.path}${loginId}`;
}

/**
 * 防重复提交（对齐 Java RepeatSubmitInterceptor）
 */
export async function applyRepeatSubmit(
  option: RepeatSubmitOption | undefined,
  req: Request
): Promise<void> {
  if (!option) return;

  const interval = option.interval ?? 3000;
  const message = option.message ?? "请勿重复提交";
  const nowParams = serializeParams(req);
  const nowData = {
    [REPEAT_PARAM]: nowParams,
    [REPEAT_TIME]: Date.now(),
  };

  const key = await buildRepeatKey(req);
  const cache = await Redis.getJSON<Record<string, unknown>>(key);

  if (cache) {
    const sameParam =
      String(cache[REPEAT_PARAM] ?? "") === String(nowData[REPEAT_PARAM]);
    const cachedTime = Number(cache[REPEAT_TIME] ?? 0);
    const nowTime = Number(nowData[REPEAT_TIME]);
    if (sameParam && nowTime - cachedTime < interval) {
      throw new GuardError(message);
    }
  }

  await Redis.setJSONPx(key, nowData, Math.max(1, interval));
}
