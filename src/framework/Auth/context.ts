import { AsyncLocalStorage } from "async_hooks";
import type { AuthContextStore } from "./types";

/**
 * 请求级鉴权上下文。
 * 中间件里 run 一次后，同一次请求内的 AuthUtil 都能取到当前 req/token/session。
 */
export const authContext = new AsyncLocalStorage<AuthContextStore>();

/** 获取当前请求的鉴权上下文；不在 Auth 中间件内时返回 undefined */
export function getAuthStore(): AuthContextStore | undefined {
  return authContext.getStore();
}
