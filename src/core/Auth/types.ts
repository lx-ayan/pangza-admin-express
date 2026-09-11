/** 登录账号 ID，兼容数字主键与字符串账号 */
export type LoginId = string | number;

/** 登录会话（对齐 Sa-Token 的 token-session） */
export interface AuthSession {
  /** 当前会话 token */
  token: string;
  /** 登录账号 */
  loginId: LoginId;
  /** 角色列表 */
  roles: string[];
  /** 权限列表 */
  permissions: string[];
  /** 创建时间戳（ms） */
  createTime: number;
  /** 过期时间戳（ms） */
  expireTime: number;
}

/** Redis 封装类形态（传入 Auth 的 redis 属性） */
export type AuthRedisClient = {
  setJSON(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  getJSON<T = unknown>(key: string): Promise<T | null>;
  del(...keys: string[]): Promise<number>;
  sAdd(key: string, ...members: string[]): Promise<number>;
  sMembers(key: string): Promise<string[]>;
  sRem(key: string, ...members: string[]): Promise<number>;
};

/** Auth 中间件配置 */
export interface AuthOptions {
  /** Token 所在请求头，默认 Authorization */
  header?: string;
  /** Authorization 前缀，默认 Bearer */
  tokenPrefix?: string;
  /** 会话有效期（毫秒），默认 2 小时 */
  timeout?: number;
  /** 不注入鉴权上下文的路径（如登录接口） */
  ignore?: string[];
  /**
   * 传入封装好的 Redis 类后，会话优先走 Redis；
   * 不传则使用内存存储。
   * 例：Auth({ redis: Redis })
   */
  redis?: AuthRedisClient;
}

/** 单个请求内的鉴权上下文（AsyncLocalStorage） */
export interface AuthContextStore {
  req: import("express").Request;
  /** 本次请求解析出的 token */
  token: string | null;
  /** 对应的有效会话；token 无效时为 null */
  session: AuthSession | null;
}
