import type { Request } from "express";
import Redis from "@/framework/Redis";
import { AuthUtil } from "@/framework/Auth";
import { GuardError } from "./errors";
import { REPEAT_SUBMIT_KEY, type RepeatSubmitOption } from "./types";

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

  const client = await Redis.getClient();
  await client.set(Redis.key(key), JSON.stringify(nowData), {
    PX: Math.max(1, interval),
  });
}
