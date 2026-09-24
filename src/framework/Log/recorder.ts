import type { Request } from "express";
import { AuthUtil } from "@/framework/Auth";
import { getLogger } from "@/framework/Logger";
import { Container } from "@/framework/Service";
import SysLogService from "@/business/service/sysLog";
import { getClientIp, resolveIpAddress } from "./ip";
import type { LogModuleOptions, LogRecordOption } from "./types";
import { BusinessType, OperType } from "./types";

const log = getLogger("OperLog");

const DEFAULT_EXCLUDE = [
  "password",
  "oldPassword",
  "newPassword",
  "confirmPassword",
  "attachments",
];

let moduleOptions: Required<Pick<LogModuleOptions, "enabled" | "silent">> &
  LogModuleOptions = {
  enabled: true,
  silent: false,
  excludeParamNames: [],
};

let logRegistered = false;

export function configureLog(options: LogModuleOptions = {}): void {
  moduleOptions = {
    ...moduleOptions,
    ...options,
    enabled: options.enabled ?? moduleOptions.enabled,
    silent: options.silent ?? moduleOptions.silent,
    excludeParamNames:
      options.excludeParamNames ?? moduleOptions.excludeParamNames,
  };
  logRegistered = true;
}

export function isLogRegistered(): boolean {
  return logRegistered;
}

export function getLogOptions() {
  return moduleOptions;
}

function shouldRecord(option?: LogRecordOption): boolean {
  if (!logRegistered || !moduleOptions.enabled) return false;
  if (!option || option.ignore) return false;
  return true;
}

function omitSensitive(value: unknown, exclude: string[]): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => omitSensitive(item, exclude));
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (exclude.includes(k)) continue;
      next[k] = omitSensitive(v, exclude);
    }
    return next;
  }
  return value;
}

function safeJson(value: unknown, exclude: string[], max = 2000): string {
  try {
    const text = JSON.stringify(omitSensitive(value, exclude) ?? null);
    return text.length > max ? text.slice(0, max) : text;
  } catch {
    return "";
  }
}

export interface RecordLogContext {
  req: Request;
  option: LogRecordOption;
  result?: unknown;
  error?: unknown;
  statusCode: number | string;
  startTime: number;
  controllerName?: string;
  /**
   * 请求结束前同步抓取的客户端 IP（避免 setImmediate 后 socket 已释放导致为空）。
   * 不传则回退从 req 再解析一次。
   */
  clientIp?: string;
  userAgent?: string;
}

/**
 * 异步写入操作日志（失败不影响业务）
 */
export async function recordOperationLog(ctx: RecordLogContext): Promise<void> {
  if (!shouldRecord(ctx.option)) return;

  try {
    const exclude = [
      ...DEFAULT_EXCLUDE,
      ...(moduleOptions.excludeParamNames ?? []),
      ...(ctx.option.excludeParamNames ?? []),
    ];

    let username = "";
    let avatar = "";
    try {
      const session = await AuthUtil.getSession();
      if (session) {
        username = session.username || String(session.loginId ?? "");
        avatar = session.avatar || "";
      }
    } catch {
      // ignore
    }

    const params =
      ctx.req.method === "GET"
        ? safeJson(ctx.req.query, exclude)
        : safeJson(ctx.req.body, exclude);

    let errorMessage = "";
    if (ctx.error) {
      errorMessage =
        ctx.error instanceof Error
          ? ctx.error.message || ctx.error.name
          : String(ctx.error);
      if (errorMessage.length > 2000) errorMessage = errorMessage.slice(0, 2000);
    }

    const ip = ctx.clientIp || getClientIp(ctx.req);
    const address = resolveIpAddress(ip);
    const userAgent = (
      ctx.userAgent ??
      String(ctx.req.headers["user-agent"] || "")
    ).slice(0, 255);

    const row = {
      title: ctx.option.title || "",
      username,
      avatar,
      business: String(ctx.option.business ?? BusinessType.OTHER),
      oper: String(ctx.option.oper ?? OperType.PC),
      params,
      response: safeJson(ctx.result, exclude),
      methodName: ctx.req.method,
      controllerName: ctx.controllerName || "",
      status: String(ctx.statusCode),
      timeLong: Math.max(0, Date.now() - ctx.startTime),
      ip,
      address,
      userAgent,
      url: String(ctx.req.originalUrl || ctx.req.url || "").slice(0, 255),
      errorMessage,
      deleteFlag: 0,
      createTime: new Date(),
    };

    const service = Container.get(SysLogService);
    await service.insert(row as any);
  } catch (e) {
    if (!moduleOptions.silent) {
      log.error({ err: e }, "记录操作日志失败");
    }
  }
}
