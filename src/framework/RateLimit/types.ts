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
