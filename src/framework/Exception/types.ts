import { ResponseCode } from "@/framework/types/enums";
import type { Request, Response } from "express";

/** 异常处理上下文 */
export interface ExceptionContext {
  req: Request;
  res: Response;
  error: unknown;
}

/**
 * 处理器返回值：
 * - ResponseData 实例或兼容对象 → 直接作为响应体
 * - { message, code?, data?, httpStatus? } → 组装后返回
 * - null / undefined → 使用内置默认处理
 */
export type ExceptionHandlerResult =
  | {
      message?: string;
      code?: number;
      data?: unknown;
      httpStatus?: number;
      /** 若已是完整响应体，设 rawBody 直接 send */
      rawBody?: unknown;
    }
  | null
  | undefined
  | void;

export type ExceptionHandlerFn = (
  error: any,
  ctx: ExceptionContext
) => ExceptionHandlerResult | Promise<ExceptionHandlerResult>;

export interface ExceptionHandlerMeta {
  /** 匹配的错误类；不传或传 Error 表示兜底 */
  errorType: Function;
  handlerName: string;
  handler: ExceptionHandlerFn;
}

/** 业务异常（对齐 Spring 自定义业务异常） */
export class BizException extends Error {
  readonly code: ResponseCode;
  readonly data: unknown;
  readonly httpStatus: number;

  constructor(
    message = "操作失败",
    code: ResponseCode = ResponseCode.ERROR,
    data: unknown = null,
    httpStatus = 200
  ) {
    super(message);
    this.name = "BizException";
    this.code = code;
    this.data = data;
    this.httpStatus = httpStatus;
  }
}
