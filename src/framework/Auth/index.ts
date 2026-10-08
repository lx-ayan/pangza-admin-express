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

function normalizeIgnorePath(p: string): string {
  if (!p) return "/";
  let s = p.trim();
  if (!s.startsWith("/")) s = `/${s}`;
  // 保留模式里的通配；仅去掉末尾多余 /
  if (s.length > 1 && s.endsWith("/") && !s.endsWith("*/") && !s.endsWith("**/")) {
    s = s.slice(0, -1);
  }
  return s;
}

/**
 * ignore 路径匹配（类 Ant / glob）：
 * - `/api/user/login`     精确，或该路径下的子路径
 * - `/api/pub/**`         以 `/api/pub` 开头的全部接口
 * - `/api/pub/*`          仅一层：`/api/pub/xxx`，不含更深
 * - `/api/aes*`           前缀（尾部单个 *）
 */
export function matchesIgnore(path: string, ignore: string[] = []): boolean {
  const requestPath = normalizeIgnorePath(path);
  const list = [...DEFAULT_IGNORE_PATHS, ...ignore].map(normalizeIgnorePath);

  return list.some((pattern) => matchIgnorePattern(requestPath, pattern));
}

function matchIgnorePattern(requestPath: string, pattern: string): boolean {
  // /api/pub/** → /api/pub 及其所有子路径
  if (pattern.endsWith("/**")) {
    const base = pattern.slice(0, -3);
    if (!base || base === "/") {
      return true;
    }
    return requestPath === base || requestPath.startsWith(`${base}/`);
  }

  // /api/pub/* → 仅匹配下一层
  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2);
    if (!requestPath.startsWith(`${base}/`)) return false;
    const rest = requestPath.slice(base.length + 1);
    return rest.length > 0 && !rest.includes("/");
  }

  // /api/aes* → 尾部单个 * 视为前缀（可跨 /）
  if (pattern.endsWith("*") && !pattern.slice(0, -1).includes("*")) {
    return requestPath.startsWith(pattern.slice(0, -1));
  }

  // 其余含 * / ** 的 glob → 正则
  if (pattern.includes("*")) {
    return globToRegExp(pattern).test(requestPath);
  }

  // 无通配：精确匹配，或「目录前缀」（/api/foo 放行 /api/foo/bar，但不放行 /api/foobar）
  return requestPath === pattern || requestPath.startsWith(`${pattern}/`);
}

/** 将 * / ** 转为正则（* 不跨 /，** 跨段） */
function globToRegExp(pattern: string): RegExp {
  let i = 0;
  let out = "^";
  while (i < pattern.length) {
    const ch = pattern[i]!;
    if (ch === "*" && pattern[i + 1] === "*") {
      out += ".*";
      i += 2;
      // 吞掉 ** 后紧跟的 /，避免 /**/ 多要求一层
      if (pattern[i] === "/") i += 1;
      continue;
    }
    if (ch === "*") {
      out += "[^/]*";
      i += 1;
      continue;
    }
    if (".+^${}()|[]\\".includes(ch)) {
      out += `\\${ch}`;
    } else {
      out += ch;
    }
    i += 1;
  }
  out += "/?$";
  return new RegExp(out);
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
