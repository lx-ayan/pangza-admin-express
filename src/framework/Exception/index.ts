import { registerExceptionHandler } from "./registry";
import type { ExceptionHandlerFn } from "./types";

export { ControllerAdvice, ExceptionHandler } from "./decorators";
export { handleException } from "./handler";
export {
  registerExceptionHandler,
  clearExceptionHandlers,
  getExceptionHandlers,
  resolveExceptionHandler,
} from "./registry";
export { BizException } from "./types";
export type {
  ExceptionContext,
  ExceptionHandlerFn,
  ExceptionHandlerResult,
  ExceptionHandlerMeta,
} from "./types";

/**
 * 函数式注册异常处理（对齐 Spring 编程式扩展）。
 *
 * @example
 * registerHandler(BizException, (e) => ({ message: e.message, code: e.code }));
 */
export function registerHandler(
  errorType: Function,
  handler: ExceptionHandlerFn
): void {
  registerExceptionHandler({
    errorType,
    handlerName: `functional:${errorType.name || "Anonymous"}`,
    handler,
  });
}

/**
 * 可选模块工厂：Application.registry(Exception()) 仅作占位，
 * 实际处理由 Application 内部调用 handleException。
 * 自定义处理器请用 @ControllerAdvice 或 registerHandler。
 */
export default function Exception() {
  const middleware = (
    _req: unknown,
    _res: unknown,
    next: (err?: unknown) => void
  ) => next();
  Object.defineProperty(middleware, Symbol.for("pangza.exception.module"), {
    value: true,
    enumerable: false,
  });
  return middleware;
}
