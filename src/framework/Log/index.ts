import { NextFunction, Request, Response } from "express";
import { configureLog } from "./recorder";
import { LOG_MIDDLEWARE_FLAG } from "./flag";
import type { LogModuleOptions } from "./types";

/**
 * Log 模块工厂（对齐 Auth）。
 * 通过 Application.registry(Log()) 注册后，
 * 路由 option.log / @Log 才会真正落库。
 */
export default function Log(options: LogModuleOptions = {}) {
  configureLog(options);

  const middleware = (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };

  Object.defineProperty(middleware, LOG_MIDDLEWARE_FLAG, {
    value: true,
    enumerable: false,
  });

  return middleware;
}

export { LOG_MIDDLEWARE_FLAG } from "./flag";
export {
  configureLog,
  recordOperationLog,
  isLogRegistered,
  getLogOptions,
} from "./recorder";
export {
  getClientIp,
  resolveIpAddress,
  normalizeIp,
  isInternalIp,
} from "./ip";
export { BusinessType, OperType } from "./types";
export type {
  LogModuleOptions,
  LogRecordOption,
  BusinessTypeValue,
  OperTypeValue,
  OperationLogRecord,
} from "./types";
