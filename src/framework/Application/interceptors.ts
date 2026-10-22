import type { Request, Response } from "express";
import type { RouteOption } from "./types";

/** 请求前拦截上下文（鉴权 / 限流之后、Controller 之前） */
export interface RequestInterceptorContext {
  req: Request;
  res: Response;
  option?: RouteOption;
  /**
   * 设为 true：跳过 Controller。
   * 可同时设置 `data`，交给响应拦截器 / 默认 ResponseData。
   * 也可自行 `res.send` 后设 `handled`（见下，与 response 侧一致时用 response.headersSent 判断）。
   */
  skipHandler?: boolean;
  /** 与 skipHandler 配合：作为后续响应拦截的业务数据 */
  data?: unknown;
}

/** 响应前拦截上下文（Controller 之后、写出响应之前） */
export interface ResponseInterceptorContext {
  req: Request;
  res: Response;
  option?: RouteOption;
  /** Controller 返回值（或请求拦截 skipHandler 时带入的 data） */
  data: unknown;
  /**
   * 默认 true：`ResponseData.success(data)`。
   * 设为 false：直接 `res.send(data)`，便于自定义外层结构。
   */
  wrap: boolean;
  /**
   * 设为 true（或已 headersSent）：框架不再写响应。
   * 用于拦截器内自行 `res.json` / `res.send`。
   */
  handled: boolean;
}

export type RequestInterceptor = (
  ctx: RequestInterceptorContext
) => void | Promise<void>;

/**
 * 响应拦截器。
 * - 返回值非 `undefined` 时替换 `ctx.data`
 * - 改 `ctx.wrap = false` 可跳过 ResponseData 包装
 * - 自行写响应后设 `ctx.handled = true`
 */
export type ResponseInterceptor = (
  ctx: ResponseInterceptorContext
) => unknown | void | Promise<unknown | void>;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

export function addRequestInterceptor(fn: RequestInterceptor): void {
  requestInterceptors.push(fn);
}

export function addResponseInterceptor(fn: ResponseInterceptor): void {
  responseInterceptors.push(fn);
}

export function clearInterceptors(): void {
  requestInterceptors.length = 0;
  responseInterceptors.length = 0;
}

export function getRequestInterceptors(): readonly RequestInterceptor[] {
  return requestInterceptors;
}

export function getResponseInterceptors(): readonly ResponseInterceptor[] {
  return responseInterceptors;
}

export async function runRequestInterceptors(
  req: Request,
  res: Response,
  option?: RouteOption
): Promise<RequestInterceptorContext> {
  const ctx: RequestInterceptorContext = { req, res, option };
  for (const fn of requestInterceptors) {
    await fn(ctx);
    if (ctx.skipHandler || res.headersSent) break;
  }
  return ctx;
}

export async function runResponseInterceptors(
  base: Omit<ResponseInterceptorContext, "wrap" | "handled"> &
    Partial<Pick<ResponseInterceptorContext, "wrap" | "handled">>
): Promise<ResponseInterceptorContext> {
  const ctx: ResponseInterceptorContext = {
    wrap: true,
    handled: false,
    ...base,
  };
  for (const fn of responseInterceptors) {
    const out = await fn(ctx);
    if (out !== undefined) {
      ctx.data = out;
    }
    if (ctx.handled || ctx.res.headersSent) {
      ctx.handled = true;
      break;
    }
  }
  if (ctx.res.headersSent) {
    ctx.handled = true;
  }
  return ctx;
}
