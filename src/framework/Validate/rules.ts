import validator from "validator";
import type { RuleOptions, ValidateRule } from "./types";

function msg(options: RuleOptions | undefined, fallback: string): string {
  return options?.message?.trim() || fallback;
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  );
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function lengthOf(value: unknown): number | null {
  if (typeof value === "string" || Array.isArray(value)) return value.length;
  return null;
}

/** 非空（undefined / null / 空字符串） */
export function notNull(options?: RuleOptions | string): ValidateRule {
  const opts = typeof options === "string" ? { message: options } : options;
  return {
    name: "NotNull",
    message: msg(opts, "不能为空"),
    validate: (value) => !isEmpty(value),
  };
}

/** 最小值：数字比大小；字符串/数组比长度 */
export function min(minValue: number, options?: RuleOptions | string): ValidateRule {
  const opts = typeof options === "string" ? { message: options } : options;
  return {
    name: "Min",
    message: msg(opts, `不能小于 ${minValue}`),
    validate: (value) => {
      if (isEmpty(value)) return true;
      const num = toNumber(value);
      if (num !== null) return num >= minValue;
      const len = lengthOf(value);
      if (len !== null) return len >= minValue;
      return false;
    },
  };
}

/** 最大值：数字比大小；字符串/数组比长度 */
export function max(maxValue: number, options?: RuleOptions | string): ValidateRule {
  const opts = typeof options === "string" ? { message: options } : options;
  return {
    name: "Max",
    message: msg(opts, `不能大于 ${maxValue}`),
    validate: (value) => {
      if (isEmpty(value)) return true;
      const num = toNumber(value);
      if (num !== null) return num <= maxValue;
      const len = lengthOf(value);
      if (len !== null) return len <= maxValue;
      return false;
    },
  };
}

/** 邮箱 */
export function email(options?: RuleOptions | string): ValidateRule {
  const opts = typeof options === "string" ? { message: options } : options;
  return {
    name: "Email",
    message: msg(opts, "邮箱格式不正确"),
    validate: (value) => {
      if (isEmpty(value)) return true;
      return typeof value === "string" && validator.isEmail(value);
    },
  };
}

/** 手机号（默认中国大陆） */
export function phone(
  options?: RuleOptions | string | { message?: string; locale?: validator.MobilePhoneLocale }
): ValidateRule {
  let message: string | undefined;
  let locale: validator.MobilePhoneLocale = "zh-CN";
  if (typeof options === "string") {
    message = options;
  } else if (options && typeof options === "object") {
    message = options.message;
    if ("locale" in options && options.locale) {
      locale = options.locale;
    }
  }
  return {
    name: "Phone",
    message: message?.trim() || "手机号格式不正确",
    validate: (value) => {
      if (isEmpty(value)) return true;
      return typeof value === "string" && validator.isMobilePhone(value, locale);
    },
  };
}

/**
 * 自定义规则（函数返回 true 表示通过）。
 * @example custom((v) => v === 'admin', '仅允许 admin')
 */
export function custom(
  fn: (value: unknown, object: unknown) => boolean | Promise<boolean>,
  options?: RuleOptions | string
): ValidateRule {
  const opts = typeof options === "string" ? { message: options } : options;
  return {
    name: "Custom",
    message: msg(opts, "校验未通过"),
    validate: fn,
  };
}
