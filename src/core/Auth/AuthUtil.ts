import { getAuthStore } from "./context";
import { NotLoginError, NotPermissionError, NotRoleError } from "./errors";
import { getSessionStore, MemoryStore, RedisStore, setSessionStore } from "./store";
import type { AuthOptions, AuthSession, LoginId } from "./types";

/** 默认会话时长：2 小时 */
const DEFAULT_TIMEOUT = 2 * 60 * 60 * 1000;

/** 运行时鉴权配置（由 Auth(options) 写入） */
let authOptions: Required<
  Pick<AuthOptions, "header" | "tokenPrefix" | "timeout">
> &
  AuthOptions = {
  header: "Authorization",
  tokenPrefix: "Bearer",
  timeout: DEFAULT_TIMEOUT,
  ignore: [],
};

/** 合并并保存 Auth 配置；配置了 redis 则优先使用 Redis 会话库 */
export function configureAuth(options: AuthOptions = {}): void {
  authOptions = {
    ...authOptions,
    ...options,
    header: options.header ?? authOptions.header,
    tokenPrefix: options.tokenPrefix ?? authOptions.tokenPrefix,
    timeout: options.timeout ?? authOptions.timeout,
    ignore: options.ignore ?? authOptions.ignore,
  };

  if (options.redis) {
    // 配置了 redis：会话优先走 Redis
    setSessionStore(new RedisStore(options.redis));
  } else {
    setSessionStore(new MemoryStore());
  }
}

/** 读取当前鉴权配置 */
export function getAuthOptions() {
  return authOptions;
}

/**
 * 类 Sa-Token 的静态工具（AuthUtil）。
 * 业务侧通过它完成登录、取 token、校验登录/角色/权限。
 */
export class AuthUtil {
  /**
   * 登录：创建会话并返回 token。
   * @param loginId 账号 ID
   * @param roles 角色列表
   * @param permissions 权限列表
   */
  static async login(
    loginId: LoginId,
    roles: string[] = [],
    permissions: string[] = []
  ): Promise<string> {
    const store = getSessionStore();
    const token = store.createToken();
    const now = Date.now();
    const session: AuthSession = {
      token,
      loginId,
      roles,
      permissions,
      createTime: now,
      expireTime: now + authOptions.timeout,
    };
    await store.set(session);

    // 若当前处于请求上下文中，同步刷新上下文里的会话
    const ctx = getAuthStore();
    if (ctx) {
      ctx.token = token;
      ctx.session = session;
    }
    return token;
  }

  /**
   * 注销当前（或指定）token 会话
   * @param token 不传则注销当前请求 token
   */
  static async logout(token?: string): Promise<void> {
    const value = token ?? this.getTokenValue();
    if (value) await getSessionStore().removeByToken(value);
    const ctx = getAuthStore();
    if (ctx && (!token || ctx.token === token)) {
      ctx.token = null;
      ctx.session = null;
    }
  }

  /** 按账号注销其全部会话 */
  static async logoutByLoginId(loginId: LoginId): Promise<void> {
    await getSessionStore().removeByLoginId(loginId);
  }

  /** 获取当前请求 token（优先上下文，其次请求头） */
  static getTokenValue(): string | null {
    const store = getAuthStore();
    if (store?.token) return store.token;
    if (store?.req) return this.readTokenFromRequest(store.req);
    return null;
  }

  /**
   * 从请求头解析 token。
   * 支持 `Authorization: Bearer xxx`，或自定义 header 直接传 token。
   */
  static readTokenFromRequest(req: {
    headers: Record<string, unknown>;
  }): string | null {
    const headerName = authOptions.header.toLowerCase();
    const raw = req.headers[headerName];
    if (typeof raw !== "string" || !raw.trim()) return null;

    const prefix = authOptions.tokenPrefix;
    if (prefix && raw.startsWith(`${prefix} `)) {
      return raw.slice(prefix.length + 1).trim() || null;
    }
    // 自定义 header 时通常直接放 token
    if (headerName !== "authorization") {
      return raw.trim();
    }
    return raw.trim() || null;
  }

  /** 获取当前有效会话；过期会清理并返回 null */
  static async getSession(): Promise<AuthSession | null> {
    const ctx = getAuthStore();
    if (ctx?.session) {
      if (Date.now() > ctx.session.expireTime) {
        await this.logout(ctx.session.token);
        return null;
      }
      return ctx.session;
    }
    const token = this.getTokenValue();
    if (!token) return null;
    const session = await getSessionStore().getByToken(token);
    if (ctx) ctx.session = session;
    return session;
  }

  /** 是否已登录 */
  static async isLogin(): Promise<boolean> {
    return (await this.getSession()) !== null;
  }

  /** 校验已登录，否则抛 NotLoginError；返回 loginId */
  static async checkLogin(): Promise<LoginId> {
    const session = await this.getSession();
    if (!session) throw new NotLoginError();
    return session.loginId;
  }

  /** 获取登录账号（未登录抛错） */
  static async getLoginId(): Promise<LoginId> {
    return this.checkLogin();
  }

  /** 获取登录账号；未登录返回 null */
  static async getLoginIdDefaultNull(): Promise<LoginId | null> {
    return (await this.getSession())?.loginId ?? null;
  }

  /** 当前角色列表 */
  static async getRoleList(): Promise<string[]> {
    return (await this.getSession())?.roles ?? [];
  }

  /** 当前权限列表 */
  static async getPermissionList(): Promise<string[]> {
    return (await this.getSession())?.permissions ?? [];
  }

  /** 是否拥有指定角色 */
  static async hasRole(role: string): Promise<boolean> {
    return (await this.getRoleList()).includes(role);
  }

  /** 是否拥有指定权限 */
  static async hasPermission(permission: string): Promise<boolean> {
    return (await this.getPermissionList()).includes(permission);
  }

  /** 校验角色，失败抛 NotRoleError */
  static async checkRole(role: string): Promise<void> {
    await this.checkLogin();
    if (!(await this.hasRole(role))) throw new NotRoleError(`无角色: ${role}`);
  }

  /** 校验权限，失败抛 NotPermissionError */
  static async checkPermission(permission: string): Promise<void> {
    await this.checkLogin();
    if (!(await this.hasPermission(permission))) {
      throw new NotPermissionError(`无权限: ${permission}`);
    }
  }
}
