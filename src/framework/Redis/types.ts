/** Redis 连接配置 */
export interface RedisConfig {
  /** 主机，默认 127.0.0.1 */
  host?: string;
  /** 端口，默认 6379 */
  port?: number;
  /** 密码，无密码可不传 */
  password?: string;
  /** 数据库编号，默认 0 */
  db?: number;
  /** key 统一前缀，便于隔离环境 */
  keyPrefix?: string;
}

/** 默认配置 */
export const defaultRedisConfig: Required<
  Pick<RedisConfig, "host" | "port" | "db" | "keyPrefix">
> &
  RedisConfig = {
  host: "127.0.0.1",
  port: 6379,
  db: 0,
  keyPrefix: "pangza:",
};

/** 限流维度（对齐 Java RateLimiterEnum） */
export const RateLimiterType = {
  DEFAULT: "DEFAULT",
  IP: "IP",
} as const;

export type RateLimiterTypeValue =
  (typeof RateLimiterType)[keyof typeof RateLimiterType];

/** @RateLimiter / option.rateLimit */
export interface RateLimitOption {
  /** 时间窗口（秒），默认 2 */
  time?: number;
  /** 窗口内最大次数，默认 1 */
  count?: number;
  /** Redis key 前缀，默认 rateLimiter: */
  key?: string;
  /** DEFAULT=全局；IP=按客户端 IP */
  type?: RateLimiterTypeValue | "DEFAULT" | "IP";
}

/** @RepeatSubmit / option.repeatSubmit */
export interface RepeatSubmitOption {
  /** 间隔（毫秒），默认 3000 */
  interval?: number;
  /** 提示文案 */
  message?: string;
}

export const RATE_LIMIT_KEY = "rateLimiter:";
export const REPEAT_SUBMIT_KEY = "repeat:submit:";
