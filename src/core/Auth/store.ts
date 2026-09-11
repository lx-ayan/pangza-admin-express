import { randomBytes } from "crypto";
import type { AuthSession, LoginId } from "./types";

/** 会话存储抽象：内存 / Redis 统一接口 */
export interface SessionStore {
  createToken(): string;
  set(session: AuthSession): Promise<void>;
  getByToken(token: string): Promise<AuthSession | null>;
  removeByToken(token: string): Promise<void>;
  removeByLoginId(loginId: LoginId): Promise<void>;
}

function createTokenValue(): string {
  return randomBytes(24).toString("hex");
}

/**
 * 内存会话仓库。
 * - tokenMap：token -> 会话
 * - loginIdMap：loginId -> token 集合
 */
export class MemoryStore implements SessionStore {
  private tokenMap = new Map<string, AuthSession>();
  private loginIdMap = new Map<string, Set<string>>();

  createToken(): string {
    return createTokenValue();
  }

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
    const session = this.tokenMap.get(token);
    if (!session) return null;
    if (Date.now() > session.expireTime) {
      await this.removeByToken(token);
      return null;
    }
    return session;
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
}

/** Redis 静态方法最小约定（与封装的 Redis 类对齐） */
export type RedisLike = {
  setJSON(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  getJSON<T = unknown>(key: string): Promise<T | null>;
  del(...keys: string[]): Promise<number>;
  sAdd(key: string, ...members: string[]): Promise<number>;
  sMembers(key: string): Promise<string[]>;
  sRem(key: string, ...members: string[]): Promise<number>;
};

/**
 * Redis 会话仓库（优先使用）。
 * key：
 * - auth:token:{token} -> AuthSession JSON + TTL
 * - auth:uid:{loginId} -> token 集合
 */
export class RedisStore implements SessionStore {
  constructor(private readonly redis: RedisLike) {}

  createToken(): string {
    return createTokenValue();
  }

  private tokenKey(token: string) {
    return `auth:token:${token}`;
  }

  private uidKey(loginId: LoginId) {
    return `auth:uid:${loginId}`;
  }

  async set(session: AuthSession): Promise<void> {
    const ttlSeconds = Math.max(
      1,
      Math.ceil((session.expireTime - Date.now()) / 1000)
    );
    await this.redis.setJSON(this.tokenKey(session.token), session, ttlSeconds);
    await this.redis.sAdd(this.uidKey(session.loginId), session.token);
  }

  async getByToken(token: string): Promise<AuthSession | null> {
    const session = await this.redis.getJSON<AuthSession>(this.tokenKey(token));
    if (!session) return null;
    if (Date.now() > session.expireTime) {
      await this.removeByToken(token);
      return null;
    }
    return session;
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
