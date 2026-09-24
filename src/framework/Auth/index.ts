import { NextFunction, Request, Response } from "express";
import { authContext } from "./context";
import { configureAuth, AuthUtil, getAuthOptions } from "./AuthUtil";
import { AUTH_MIDDLEWARE_FLAG } from "./flag";
import type { AuthOptions } from "./types";

/** 默认忽略的浏览器/探测路径，避免误进鉴权日志 */
const DEFAULT_IGNORE_PATHS = [
  "/.well-known",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

/** 判断路径是否在忽略列表中（支持前缀与尾部 *） */
export function matchesIgnore(path: string, ignore: string[] = []): boolean {
  const list = [...DEFAULT_IGNORE_PATHS, ...ignore];
  return list.some((item) => {
    if (item.endsWith("*")) {
      return path.startsWith(item.slice(0, -1));
    }
    return path === item || path.startsWith(`${item}/`) || path.startsWith(item);
  });
}

/** 是否命中 Auth 全局 ignore（优先级最高） */
export function isGloballyIgnored(path: string): boolean {
  return matchesIgnore(path, getAuthOptions().ignore ?? []);
}

/**
 * Auth 中间件工厂（类 Sa-Token）。
 * 只负责解析 token、注入请求上下文，不强制登录；
 * 需要登录的接口请在业务里调用 AuthUtil.checkLogin()。
 *
 * @example
 * Auth({
 *   tokenName: 'satoken',
 *   timeout: 30 * 24 * 60 * 60 * 1000,
 *   activityTimeout: -1,
 *   allowConcurrentLogin: false,
 *   isShare: false,
 *   tokenStyle: 'uuid', // 或 'jwt'
 *   jwtSecret: 'change-me',
 * })
 */
export default function Auth(options: AuthOptions = {}) {
  configureAuth(options);

  const middleware = (req: Request, _res: Response, next: NextFunction) => {
    // 预检与忽略路径直接放行
    if (req.method === "OPTIONS" || matchesIgnore(req.path, options.ignore)) {
      return next();
    }

    const token = AuthUtil.readTokenFromRequest(req);

    void (async () => {
      try {
        const session = await AuthUtil.loadSession(token, { touch: true });

        authContext.run(
          {
            req,
            token,
            session,
          },
          () => next()
        );
      } catch (err) {
        next(err);
      }
    })();
  };

  Object.defineProperty(middleware, AUTH_MIDDLEWARE_FLAG, {
    value: true,
    enumerable: false,
  });

  return middleware;
}

export { AuthUtil, getAuthOptions, isSessionExpired } from "./AuthUtil";
export { AUTH_MIDDLEWARE_FLAG } from "./flag";
export {
  AuthError,
  NotLoginError,
  NotPermissionError,
  NotRoleError,
} from "./errors";
export { createAuthToken, generateStyleToken, verifyAuthToken } from "./token";
export type {
  AuthOptions,
  AuthSession,
  LoginId,
  LoginOptions,
  TokenStyle,
  AuthCheckMode,
  ResolvedAuthOptions,
} from "./types";
