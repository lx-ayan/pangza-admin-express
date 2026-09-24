/** 角色 / 权限数组内部的校验模式 */
export type AuthCheckMode = "OR" | "AND";

/** 登录账号 ID，兼容数字主键与字符串账号 */
export type LoginId = string | number;

/**
 * Token 风格（对齐 Sa-Token token-style）
 * - uuid / simple-uuid / random-* / tik：随机串
 * - jwt：使用 jsonwebtoken 签发
 */
export type TokenStyle =
  | "uuid"
  | "simple-uuid"
  | "random-32"
  | "random-64"
  | "random-128"
  | "tik"
  | "jwt";

/** 登录会话（对齐 Sa-Token 的 token-session） */
export interface AuthSession {
  /** 当前会话 token */
  token: string;
  /** 登录账号 */
  loginId: LoginId;
  /** 登录设备标识（多端：web / app / pc 等） */
  device?: string;
  /** 角色列表 */
  roles: string[];
  /** 权限列表 */
  permissions: string[];
  /** 展示用用户名（写操作日志等） */
  username?: string;
  /** 头像 */
  avatar?: string;
  /** 创建时间戳（ms） */
  createTime: number;
  /** 过期时间戳（ms）；timeout=-1 时可为 Number.MAX_SAFE_INTEGER */
  expireTime: number;
  /** 最近活跃时间（ms），用于 activity-timeout */
  lastActiveTime: number;
}

/** Redis 封装类形态（传入 Auth 的 redis 属性） */
export type AuthRedisClient = {
  setJSON(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  getJSON<T = unknown>(key: string): Promise<T | null>;
  del(...keys: string[]): Promise<number>;
  sAdd(key: string, ...members: string[]): Promise<number>;
  sMembers(key: string): Promise<string[]>;
  sRem(key: string, ...members: string[]): Promise<number>;
  expire?(key: string, ttlSeconds: number): Promise<boolean>;
};

/** 登录额外参数 */
export interface LoginOptions {
  roles?: string[];
  permissions?: string[];
  username?: string;
  avatar?: string;
  /** 设备标识，多端登录区分 */
  device?: string;
  /** 覆盖本次会话超时（毫秒）；不传用全局 timeout */
  timeout?: number;
}

/** Auth 中间件配置（对齐 Sa-Token） */
export interface AuthOptions {
  /**
   * Token 名称（请求头 / Cookie 名），对齐 sa-token.token-name。
   * 默认优先读此 header，其次 Authorization。
   */
  tokenName?: string;
  /** Token 所在请求头；默认 Authorization（兼容旧配置） */
  header?: string;
  /** Authorization 前缀，默认 Bearer；设为 "" 表示无前缀 */
  tokenPrefix?: string;
  /**
   * token 有效期（毫秒），对齐 timeout。
   * 默认 2 小时；传 -1 表示永不过期。
   */
  timeout?: number;
  /**
   * 临时有效期 / 闲置超时（毫秒），对齐 activity-timeout。
   * 指定时间内无操作则视为过期；-1 表示不启用（默认）。
   */
  activityTimeout?: number;
  /**
   * 是否允许同一账号并发登录，对齐 allow-concurrent-login / is-concurrent。
   * true：允许多端同时在线；false：新登录挤掉旧登录。
   * 默认 true。
   */
  allowConcurrentLogin?: boolean;
  /**
   * 多人登录同一账号是否共用一个 token，对齐 is-share。
   * true：复用已有有效 token；false：每次登录新建 token。
   * 默认 false。
   */
  isShare?: boolean;
  /** token 风格，对齐 token-style；默认 uuid */
  tokenStyle?: TokenStyle;
  /** 自定义生成 token（优先级高于 tokenStyle） */
  createToken?: (payload: {
    loginId: LoginId;
    device?: string;
  }) => string | Promise<string>;
  /** JWT 密钥（tokenStyle=jwt 时必填，或走默认） */
  jwtSecret?: string;
  /** JWT 算法，默认 HS256 */
  jwtAlgorithm?: string;
  /** 不注入鉴权上下文的路径（如登录接口） */
  ignore?: string[];
  /**
   * 传入封装好的 Redis 类后，会话优先走 Redis；
   * 不传则使用内存存储。
   * 例：Auth({ redis: Redis })
   */
  redis?: AuthRedisClient;
  /** 是否从 Cookie 读取 token（tokenName），默认 true */
  readCookie?: boolean;
  /**
   * 角色 / 权限数组的默认校验模式。
   * OR：满足一个即可；AND：必须全部满足。默认 OR。
   * 可被 @AuthCheckRole / @AuthCheckPermission 的 mode 覆盖。
   */
  checkMode?: AuthCheckMode;
}

/** 单个请求内的鉴权上下文（AsyncLocalStorage） */
export interface AuthContextStore {
  req: import("express").Request;
  /** 本次请求解析出的 token */
  token: string | null;
  /** 对应的有效会话；token 无效时为 null */
  session: AuthSession | null;
}

/** 解析后的完整配置 */
export interface ResolvedAuthOptions {
  tokenName: string;
  header: string;
  tokenPrefix: string;
  timeout: number;
  activityTimeout: number;
  allowConcurrentLogin: boolean;
  isShare: boolean;
  tokenStyle: TokenStyle;
  createToken?: AuthOptions["createToken"];
  jwtSecret: string;
  jwtAlgorithm: string;
  ignore: string[];
  redis?: AuthRedisClient;
  readCookie: boolean;
  /** 角色 / 权限默认校验模式，默认 OR */
  checkMode: AuthCheckMode;
}
