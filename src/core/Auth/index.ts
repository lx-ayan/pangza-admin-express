import { NextFunction, Request, Response } from "express";
import { authContext } from "./context";
import { configureAuth, AuthUtil } from "./AuthUtil";
import { AUTH_MIDDLEWARE_FLAG } from "./flag";
import { getSessionStore } from "./store";
import type { AuthOptions } from "./types";

/** 默认忽略的浏览器/探测路径，避免误进鉴权日志 */
const DEFAULT_IGNORE_PATHS = [
  "/.well-known",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

/** 判断路径是否在忽略列表中（支持前缀与尾部 *） */
function matchesIgnore(path: string, ignore: string[] = []): boolean {
  const list = [...DEFAULT_IGNORE_PATHS, ...ignore];
  return list.some((item) => {
    if (item.endsWith("*")) {
      return path.startsWith(item.slice(0, -1));
    }
    return path === item || path.startsWith(`${item}/`) || path.startsWith(item);
  });
}

/**
 * Auth 中间件工厂（类 Sa-Token）。
 * 只负责解析 token、注入请求上下文，不强制登录；
 * 需要登录的接口请在业务里调用 AuthUtil.checkLogin()。
 * 传入 redis: Redis 后会话优先存 Redis。
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
        const session = token
          ? await getSessionStore().getByToken(token)
          : null;

        // 将 req/token/session 绑定到当前异步上下文，供 AuthUtil 使用
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

  // 标记为 Auth 中间件，Application.registry 可据此识别
  Object.defineProperty(middleware, AUTH_MIDDLEWARE_FLAG, {
    value: true,
    enumerable: false,
  });

  return middleware;
}

export { AuthUtil } from "./AuthUtil";
export { AUTH_MIDDLEWARE_FLAG } from "./flag";
export {
  AuthError,
  NotLoginError,
  NotPermissionError,
  NotRoleError,
} from "./errors";
export type { AuthOptions, AuthSession, LoginId } from "./types";
