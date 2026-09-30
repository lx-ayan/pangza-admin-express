import {
  BizException,
  ControllerAdvice,
  ExceptionHandler,
  type ExceptionContext,
} from "@/framework/Exception";
import { getLogger } from "@/framework/Logger";
import { ValidationError } from "@/framework/Validate";
import { AuthError } from "@/framework/Auth";
import { OrmError } from "@/framework/ORM";
import { GuardError } from "@/framework/Redis";

const log = getLogger("GlobalExceptionHandler");

/**
 * 全局异常处理（对齐 Spring @RestControllerAdvice）。
 * 放在 business/advice，Application.start 会自动扫描加载。
 */
@ControllerAdvice()
export default class GlobalExceptionHandler {
  @ExceptionHandler(ValidationError)
  handleValidation(error: ValidationError) {
    return {
      message: error.message,
      code: error.code,
      data: error.errors,
    };
  }

  @ExceptionHandler(BizException)
  handleBiz(error: BizException) {
    return {
      message: error.message,
      code: error.code,
      data: error.data,
      httpStatus: error.httpStatus,
    };
  }

  @ExceptionHandler(AuthError)
  handleAuth(error: AuthError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  @ExceptionHandler(OrmError)
  handleOrm(error: OrmError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  @ExceptionHandler(GuardError)
  handleGuard(error: GuardError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  /** 兜底：未匹配到更具体类型时走这里 */
  @ExceptionHandler(Error)
  handleError(error: Error, _ctx: ExceptionContext) {
    log.error({ err: error }, "unhandled error");
    return {
      message: error.message || "服务器内部错误",
      code: 500,
      httpStatus: 500,
    };
  }
}
