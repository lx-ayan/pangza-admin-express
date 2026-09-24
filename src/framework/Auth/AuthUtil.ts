import { getAuthStore } from "./context";
import { NotLoginError, NotPermissionError, NotRoleError } from "./errors";
import {
  getSessionStore,
  MemoryStore,
  RedisStore,
  setSessionStore,
} from "./store";
import { createAuthToken, verifyAuthToken } from "./token";
import type {
  AuthOptions,
  AuthSession,
  LoginId,
  LoginOptions,
  ResolvedAuthOptions,
} from "./types";

/** 默认会话时长：2 小时（毫秒） */
const DEFAULT_TIMEOUT = 2 * 60 * 60 * 1000;

const DEFAULT_JWT_SECRET = "pangza-admin-express-jwt-secret";

/** 运行时鉴权配置（由 Auth(options) 写入） */
let authOptions: ResolvedAuthOptions = {
  tokenName: "satoken",
  header: "Authorization",
  tokenPrefix: "Bearer",
  timeout: DEFAULT_TIMEOUT,
  activityTimeout: -1,
  allowConcurrentLogin: true,
  isShare: false,
  tokenStyle: "uuid",
  jwtSecret: DEFAULT_JWT_SECRET,
  jwtAlgorithm: "HS256",
  ignore: [],
  readCookie: true,
  checkMode: "OR",
};

function resolveExpireTime(timeoutMs: number, now = Date.now()): number {
  if (timeoutMs < 0) return Number.MAX_SAFE_INTEGER;
  return now + timeoutMs;
}

/** 合并并保存 Auth 配置；配置了 redis 则优先使用 Redis 会话库 */
export function configureAuth(options: AuthOptions = {}): void {
  authOptions = {
    ...authOptions,
    ...options,
    tokenName: options.tokenName ?? authOptions.tokenName,
    header: options.header ?? authOptions.header,
    tokenPrefix:
      options.tokenPrefix !== undefined
        ? options.tokenPrefix
        : authOptions.tokenPrefix,
    timeout: options.timeout ?? authOptions.timeout,
    activityTimeout: options.activityTimeout ?? authOptions.activityTimeout,
    allowConcurrentLogin:
      options.allowConcurrentLogin ?? authOptions.allowConcurrentLogin,
    isShare: options.isShare ?? authOptions.isShare,
    tokenStyle: options.tokenStyle ?? authOptions.tokenStyle,
    createToken: options.createToken ?? authOptions.createToken,
    jwtSecret: options.jwtSecret ?? authOptions.jwtSecret,
    jwtAlgorithm: options.jwtAlgorithm ?? authOptions.jwtAlgorithm,
    ignore: options.ignore ?? authOptions.ignore,
    readCookie: options.readCookie ?? authOptions.readCookie,
    redis: options.redis ?? authOptions.redis,
    checkMode: options.checkMode ?? authOptions.checkMode,
  };

  if (options.redis) {
    setSessionStore(new RedisStore(options.redis));
  } else if (options.redis === undefined && !authOptions.redis) {
    setSessionStore(new MemoryStore());
  }
}

/** 读取当前鉴权配置 */
export function getAuthOptions(): ResolvedAuthOptions {
  return authOptions;
}

function normalizeLoginArgs(
  rolesOrOptions?: string[] | LoginOptions,
  permissions?: string[],
  profile?: { username?: string; avatar?: string; device?: string }
): LoginOptions {
  if (
    rolesOrOptions &&
    !Array.isArray(rolesOrOptions) &&
    typeof rolesOrOptions === "object"
  ) {
    return rolesOrOptions;
  }
  return {
    roles: (rolesOrOptions as string[] | undefined) ?? [],
    permissions: permissions ?? [],
    username: profile?.username,
    avatar: profile?.avatar,
    device: profile?.device,
  };
}

/** 校验会话是否因绝对过期 / 闲置过期而失效 */
export function isSessionExpired(
  session: AuthSession,
  options: ResolvedAuthOptions = authOptions
): boolean {
  const now = Date.now();
  if (now > session.expireTime) return true;
  if (
    options.activityTimeout >= 0 &&
    now - (session.lastActiveTime || session.createTime) >
      options.activityTimeout
  ) {
    return true;
  }
  return false;
}

/**
 * 类 Sa-Token 的静态工具（AuthUtil）。
 * 业务侧通过它完成登录、取 token、校验登录/角色/权限。
 */
export class AuthUtil {
  /**
   * 登录：创建会话并返回 token。
   *
   * @example
   * AuthUtil.login(id, ['admin'], ['user:read'])
   * AuthUtil.login(id, { roles, permissions, device: 'web', username })
   */
  static async login(
    loginId: LoginId,
    rolesOrOptions: string[] | LoginOptions = [],
    permissions: string[] = [],
    profile?: { username?: string; avatar?: string; device?: string }
  ): Promise<string> {
    const opt = normalizeLoginArgs(rolesOrOptions, permissions, profile);
    const store = getSessionStore();
    const timeout = opt.timeout ?? authOptions.timeout;
    const device = opt.device;
    const now = Date.now();

    // is-share：复用已有有效 token（同账号 + 同设备）
    if (authOptions.isShare) {
      const tokens = await store.listTokensByLoginId(loginId);
      for (const t of tokens) {
        const old = await store.getByToken(t);
        if (!old || isSessionExpired(old)) {
          if (old) await store.removeByToken(t);
          continue;
        }
        if (device && old.device && old.device !== device) continue;
        if (!device && old.device) continue;

        old.roles = opt.roles ?? old.roles;
        old.permissions = opt.permissions ?? old.permissions;
        old.username = opt.username ?? old.username;
        old.avatar = opt.avatar ?? old.avatar;
        old.expireTime = resolveExpireTime(timeout, now);
        old.lastActiveTime = now;
        await store.set(old);
        this.syncContext(old.token, old);
        return old.token;
      }
    }

    // 不允许并发：挤掉旧登录
    if (!authOptions.allowConcurrentLogin) {
      if (device) {
        const tokens = await store.listTokensByLoginId(loginId);
        for (const t of tokens) {
          const old = await store.getByToken(t);
          if (old && (!old.device || old.device === device)) {
            await store.removeByToken(t);
          }
        }
      } else {
        await store.removeByLoginId(loginId);
      }
    }

    const token = await createAuthToken(authOptions, {
      loginId,
      device,
      timeout,
    });

    const session: AuthSession = {
      token,
      loginId,
      device,
      roles: opt.roles ?? [],
      permissions: opt.permissions ?? [],
      username: opt.username,
      avatar: opt.avatar,
      createTime: now,
      expireTime: resolveExpireTime(timeout, now),
      lastActiveTime: now,
    };
    await store.set(session);
    this.syncContext(token, session);
    return token;
  }

  private static syncContext(token: string, session: AuthSession | null): void {
    const ctx = getAuthStore();
    if (ctx) {
      ctx.token = token;
      ctx.session = session;
    }
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

  /** 按账号 + 设备注销 */
  static async logoutByDevice(
    loginId: LoginId,
    device: string
  ): Promise<void> {
    const store = getSessionStore();
    const tokens = await store.listTokensByLoginId(loginId);
    for (const t of tokens) {
      const session = await store.getByToken(t);
      if (session?.device === device) {
        await store.removeByToken(t);
      }
    }
  }

  /** 获取当前请求 token（优先上下文，其次请求头/Cookie） */
  static getTokenValue(): string | null {
    const store = getAuthStore();
    if (store?.token) return store.token;
    if (store?.req) return this.readTokenFromRequest(store.req);
    return null;
  }

  /**
   * 从请求解析 token：
   * 1. tokenName 请求头（如 satoken）
   * 2. Authorization / 自定义 header（可带 Bearer 前缀）
   * 3. Cookie[tokenName]
   */
  static readTokenFromRequest(req: {
    headers: Record<string, unknown>;
    cookies?: Record<string, unknown>;
  }): string | null {
    const tryRaw = (raw: unknown): string | null => {
      if (typeof raw !== "string" || !raw.trim()) return null;
      const value = raw.trim();
      const prefix = authOptions.tokenPrefix;
      if (prefix && value.startsWith(`${prefix} `)) {
        return value.slice(prefix.length + 1).trim() || null;
      }
      return value || null;
    };

    // 1. tokenName header（Sa-Token 常用）
    const byName = tryRaw(req.headers[authOptions.tokenName.toLowerCase()]);
    if (byName) return byName;

    // 2. Authorization / 兼容 header
    const headerName = authOptions.header.toLowerCase();
    if (headerName !== authOptions.tokenName.toLowerCase()) {
      const byHeader = tryRaw(req.headers[headerName]);
      if (byHeader) return byHeader;
    }

    // 3. Cookie
    if (authOptions.readCookie) {
      const cookies = req.cookies;
      if (cookies) {
        const byCookie = tryRaw(cookies[authOptions.tokenName]);
        if (byCookie) return byCookie;
      }
    }

    return null;
  }

  /**
   * 加载并校验会话；过期清理；可选刷新 lastActiveTime。
   */
  static async loadSession(
    token: string | null,
    options: { touch?: boolean } = { touch: true }
  ): Promise<AuthSession | null> {
    if (!token) return null;
    if (!verifyAuthToken(authOptions, token)) {
      await getSessionStore().removeByToken(token);
      return null;
    }

    const session = await getSessionStore().getByToken(token);
    if (!session) return null;

    // 兼容旧会话无 lastActiveTime
    if (!session.lastActiveTime) {
      session.lastActiveTime = session.createTime;
    }

    if (isSessionExpired(session)) {
      await getSessionStore().removeByToken(token);
      return null;
    }

    if (options.touch !== false) {
      session.lastActiveTime = Date.now();
      await getSessionStore().touch(session);
    }
    return session;
  }

  /** 获取当前有效会话；过期会清理并返回 null */
  static async getSession(): Promise<AuthSession | null> {
    const ctx = getAuthStore();
    if (ctx?.session) {
      if (isSessionExpired(ctx.session)) {
        await this.logout(ctx.session.token);
        return null;
      }
      // 请求内已 touch 过则不重复写
      return ctx.session;
    }
    const token = this.getTokenValue();
    const session = await this.loadSession(token);
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

  /** 当前登录设备 */
  static async getLoginDevice(): Promise<string | undefined> {
    return (await this.getSession())?.device;
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
