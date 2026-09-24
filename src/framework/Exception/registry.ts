import type { ExceptionHandlerMeta } from "./types";

const adviceList: ExceptionHandlerMeta[] = [];

/** 注册一条异常处理（后注册的同类型优先） */
export function registerExceptionHandler(meta: ExceptionHandlerMeta): void {
  adviceList.unshift(meta);
}

/** 清空（测试用） */
export function clearExceptionHandlers(): void {
  adviceList.length = 0;
}

/** 当前已注册的处理器（只读副本） */
export function getExceptionHandlers(): ExceptionHandlerMeta[] {
  return [...adviceList];
}

/**
 * 按继承链匹配最合适的处理器。
 * 优先：精确类型 > 更近的父类 > 通用 Error。
 */
export function resolveExceptionHandler(
  error: unknown
): ExceptionHandlerMeta | undefined {
  if (error === null || error === undefined) return undefined;

  const errorCtor =
    typeof error === "object" && (error as any).constructor
      ? ((error as any).constructor as Function)
      : undefined;

  // 1. 精确匹配
  if (errorCtor) {
    const exact = adviceList.find((h) => h.errorType === errorCtor);
    if (exact) return exact;
  }

  // 2. instanceof 匹配（跳过过于宽泛的 Error，留给第 3 步）
  if (typeof error === "object") {
    let best: ExceptionHandlerMeta | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const handler of adviceList) {
      if (handler.errorType === Error) continue;
      if (!(error instanceof (handler.errorType as any))) continue;
      const distance = inheritanceDistance(
        (error as object).constructor as Function,
        handler.errorType
      );
      if (distance >= 0 && distance < bestDistance) {
        best = handler;
        bestDistance = distance;
      }
    }
    if (best) return best;
  }

  // 3. 兜底 Error
  return adviceList.find((h) => h.errorType === Error);
}

function inheritanceDistance(from: Function, to: Function): number {
  let distance = 0;
  let cur: Function | null = from;
  while (cur && cur !== Function.prototype) {
    if (cur === to) return distance;
    cur = Object.getPrototypeOf(cur.prototype)?.constructor ?? null;
    distance += 1;
    if (distance > 32) break;
  }
  return -1;
}
