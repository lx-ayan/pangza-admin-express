import "reflect-metadata";
import { registerExceptionHandler } from "./registry";
import type { ExceptionHandlerFn } from "./types";

const HANDLERS_KEY = Symbol.for("pangza.exception.handlers");

interface PendingHandler {
  errorType: Function;
  handlerName: string;
}

/**
 * 类装饰器：标记全局异常处理类（对齐 @RestControllerAdvice）。
 * 类加载时自动注册其中的 @ExceptionHandler 方法。
 *
 * @example
 * @ControllerAdvice()
 * class GlobalExceptionHandler {
 *   @ExceptionHandler(BizException)
 *   handleBiz(e: BizException) { return { message: e.message, code: e.code }; }
 * }
 */
export function ControllerAdvice(): ClassDecorator {
  return (ctor) => {
    const Ctor = ctor as unknown as new () => object;
    const pending =
      (Reflect.getOwnMetadata(HANDLERS_KEY, ctor) as PendingHandler[] | undefined) ??
      [];
    const instance = new Ctor();

    for (const item of pending) {
      const method = (instance as Record<string, unknown>)[item.handlerName];
      if (typeof method !== "function") {
        throw new Error(
          `[ControllerAdvice] ${Ctor.name}.${item.handlerName} 不是函数`
        );
      }
      const bound = (method as Function).bind(instance) as ExceptionHandlerFn;
      registerExceptionHandler({
        errorType: item.errorType,
        handlerName: `${Ctor.name}.${item.handlerName}`,
        handler: bound,
      });
    }
  };
}

/**
 * 方法装饰器：声明处理某类异常（对齐 @ExceptionHandler）。
 * @param errorType 错误类，默认 Error（兜底）
 */
export function ExceptionHandler(errorType: Function = Error): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (target as object).constructor;
    const list =
      (Reflect.getOwnMetadata(HANDLERS_KEY, ctor) as PendingHandler[] | undefined) ??
      [];
    list.push({
      errorType,
      handlerName: String(propertyKey),
    });
    Reflect.defineMetadata(HANDLERS_KEY, list, ctor);
  };
}
