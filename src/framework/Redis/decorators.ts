import type { RateLimitOption, RepeatSubmitOption } from "./types";
import {
  mergeMethodRateLimit,
  mergeMethodRepeatSubmit,
} from "@/framework/Application/metadata";

export { Cacheable, CacheEvict } from "./cache";

/**
 * 接口限流（对齐 Java @RateLimiter）。
 * @example @RateLimiter({ time: 10, count: 3, type: RateLimiterType.IP })
 * @example @RateLimiter({ time: 60, count: 30, type: RateLimiterType.USER, mode: 'sliding' })
 */
export function RateLimiter(option: RateLimitOption = {}): MethodDecorator {
  return (target, propertyKey) => {
    mergeMethodRateLimit(
      (target as object).constructor,
      String(propertyKey),
      option
    );
  };
}

/**
 * 防重复提交（对齐 Java @RepeatSubmit）。
 * @example @RepeatSubmit()
 * @example @RepeatSubmit({ interval: 5000, message: '请勿重复提交' })
 */
export function RepeatSubmit(option: RepeatSubmitOption = {}): MethodDecorator {
  return (target, propertyKey) => {
    mergeMethodRepeatSubmit(
      (target as object).constructor,
      String(propertyKey),
      option
    );
  };
}
