import type { Request, Response } from "express";
import ResponseData from "@/framework/utils/entity/ResponseData";
import { ResponseCode } from "@/framework/types/enums";
import { AuthError } from "@/framework/Auth";
import { getLogger } from "@/framework/Logger";
import { OrmError } from "@/framework/ORM";
import { GuardError } from "@/framework/Redis";
import { ValidationError } from "@/framework/Validate";
import { resolveExceptionHandler } from "./registry";
import { BizException } from "./types";
import type { ExceptionContext, ExceptionHandlerResult } from "./types";

const log = getLogger("Exception");

/** 判断是否像 ResponseData */
function isResponseDataLike(value: unknown): value is ResponseData<unknown> {
  return (
    !!value &&
    typeof value === "object" &&
    "code" in (value as object) &&
    "message" in (value as object) &&
    "data" in (value as object)
  );
}

/**
 * 统一解析并发送错误响应。
 * 优先走用户 @ControllerAdvice / registerExceptionHandler，否则用内置规则。
 */
export async function handleException(
  req: Request,
  res: Response,
  error: unknown
): Promise<void> {
  if (res.headersSent) return;

  const ctx: ExceptionContext = { req, res, error };
  const matched = resolveExceptionHandler(error);

  if (matched) {
    try {
      const result = await matched.handler(error, ctx);
      if (sendHandlerResult(res, result)) return;
    } catch (handlerError) {
      log.error(
        { err: handlerError, handler: matched.handlerName },
        "自定义异常处理器抛错"
      );
      // 处理器自身失败时回落内置
    }
  }

  sendBuiltin(res, error);
}

function sendHandlerResult(
  res: Response,
  result: ExceptionHandlerResult
): boolean {
  if (result === null || result === undefined) return false;

  if (isResponseDataLike(result)) {
    res.status(200).send(result);
    return true;
  }

  if (typeof result === "object") {
    if ("rawBody" in result && result.rawBody !== undefined) {
      const status = result.httpStatus ?? 200;
      res.status(status).send(result.rawBody);
      return true;
    }
    const httpStatus = result.httpStatus ?? 200;
    const body = ResponseData.error(
      result.message ?? "操作失败",
      result.data ?? null,
      (result.code as ResponseCode) ?? ResponseCode.ERROR
    );
    res.status(httpStatus).send(body);
    return true;
  }

  return false;
}

/** 内置默认错误映射（未注册自定义处理器时） */
function sendBuiltin(res: Response, error: unknown): void {
  if (error instanceof BizException) {
    res
      .status(error.httpStatus)
      .send(ResponseData.error(error.message, error.data, error.code));
    return;
  }
  if (error instanceof ValidationError) {
    res
      .status(200)
      .send(ResponseData.error(error.message, error.errors, error.code));
    return;
  }
  if (error instanceof AuthError) {
    res.status(200).send(ResponseData.error(error.message, null, error.code));
    return;
  }
  if (error instanceof OrmError) {
    res.status(200).send(ResponseData.error(error.message, null, error.code));
    return;
  }
  if (error instanceof GuardError) {
    res.status(200).send(ResponseData.error(error.message, null, error.code));
    return;
  }

  const message = error instanceof Error ? error.message : "错误";
  log.error({ err: error }, "unhandled exception");
  res.status(500).send(ResponseData.error(message));
}
