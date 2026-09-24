import type { AuthSession, LoginId } from "./types";

/** 会话存储抽象：内存 / Redis 统一接口 */
export interface SessionStore {
  set(session: AuthSession): Promise<void>;
  getByToken(token: string): Promise<AuthSession | null>;
  removeByToken(token: string): Promise<void>;
  removeByLoginId(loginId: LoginId): Promise<void>;
  /** 某账号下全部 token */
  listTokensByLoginId(loginId: LoginId): Promise<string[]>;
  /** 刷新活跃时间与 TTL */
  touch(session: AuthSession): Promise<void>;
}

/**
 * 内存会话仓库。
 * - tokenMap：token -> 会话
 * - loginIdMap：loginId -> token 集合
 */
export class MemoryStore implements SessionStore {
  private tokenMap = new Map<string, AuthSession>();
  private loginIdMap = new Map<string, Set<string>>();

  async set(session: AuthSession): Promise<void> {
    this.tokenMap.set(session.token, session);
    const key = String(session.loginId);
    let tokens = this.loginIdMap.get(key);
    if (!tokens) {
      tokens = new Set();
      this.loginIdMap.set(key, tokens);
    }
    tokens.add(session.token);
  }

  async getByToken(token: string): Promise<AuthSession | null> {
    return this.tokenMap.get(token) ?? null;
  }

  async removeByToken(token: string): Promise<void> {
    const session = this.tokenMap.get(token);
    if (!session) return;
    this.tokenMap.delete(token);
    const key = String(session.loginId);
    const tokens = this.loginIdMap.get(key);
    if (tokens) {
      tokens.delete(token);
      if (tokens.size === 0) this.loginIdMap.delete(key);
    }
  }

  async removeByLoginId(loginId: LoginId): Promise<void> {
    const key = String(loginId);
    const tokens = this.loginIdMap.get(key);
    if (!tokens) return;
    for (const token of [...tokens]) {
      this.tokenMap.delete(token);
    }
    this.loginIdMap.delete(key);
  }

  async listTokensByLoginId(loginId: LoginId): Promise<string[]> {
    const tokens = this.loginIdMap.get(String(loginId));
    return tokens ? [...tokens] : [];
  }

  async touch(session: AuthSession): Promise<void> {
    this.tokenMap.set(session.token, session);
  }
}

/** Redis 静态方法最小约定（与封装的 Redis 类对齐） */
export type RedisLike = {
  setJSON(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  getJSON<T = unknown>(key: string): Promise<T | null>;
  del(...keys: string[]): Promise<number>;
  sAdd(key: string, ...members: string[]): Promise<number>;
  sMembers(key: string): Promise<string[]>;
  sRem(key: string, ...members: string[]): Promise<number>;
  expire?(key: string, ttlSeconds: number): Promise<boolean>;
};

/**
 * Redis 会话仓库（优先使用）。
 * key：
 * - auth:token:{token} -> AuthSession JSON + TTL
 * - auth:uid:{loginId} -> token 集合
 */
export class RedisStore implements SessionStore {
  constructor(private readonly redis: RedisLike) {}

  private tokenKey(token: string) {
    return `auth:token:${token}`;
  }

  private uidKey(loginId: LoginId) {
    return `auth:uid:${loginId}`;
  }

  private ttlSeconds(session: AuthSession): number | undefined {
    if (session.expireTime >= Number.MAX_SAFE_INTEGER / 2) {
      // 永不过期：不设 TTL（或很长）
      return undefined;
    }
    return Math.max(1, Math.ceil((session.expireTime - Date.now()) / 1000));
  }

  async set(session: AuthSession): Promise<void> {
    const ttl = this.ttlSeconds(session);
    await this.redis.setJSON(this.tokenKey(session.token), session, ttl);
    await this.redis.sAdd(this.uidKey(session.loginId), session.token);
  }

  async getByToken(token: string): Promise<AuthSession | null> {
    return this.redis.getJSON<AuthSession>(this.tokenKey(token));
  }

  async removeByToken(token: string): Promise<void> {
    const session = await this.redis.getJSON<AuthSession>(this.tokenKey(token));
    await this.redis.del(this.tokenKey(token));
    if (session) {
      await this.redis.sRem(this.uidKey(session.loginId), token);
    }
  }

  async removeByLoginId(loginId: LoginId): Promise<void> {
    const key = this.uidKey(loginId);
    const tokens = await this.redis.sMembers(key);
    if (tokens.length > 0) {
      await this.redis.del(...tokens.map((t) => this.tokenKey(t)), key);
    } else {
      await this.redis.del(key);
    }
  }

  async listTokensByLoginId(loginId: LoginId): Promise<string[]> {
    return this.redis.sMembers(this.uidKey(loginId));
  }

  async touch(session: AuthSession): Promise<void> {
    const ttl = this.ttlSeconds(session);
    await this.redis.setJSON(this.tokenKey(session.token), session, ttl);
  }
}

/** 当前生效的会话仓库，默认内存 */
let activeStore: SessionStore = new MemoryStore();

export function getSessionStore(): SessionStore {
  return activeStore;
}

/** 切换会话仓库（配置了 redis 时切到 RedisStore） */
export function setSessionStore(store: SessionStore): void {
  activeStore = store;
}
