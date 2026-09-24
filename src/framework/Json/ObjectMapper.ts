import {
  getClassJsonInclude,
  getGlobalFieldFormat,
  getGlobalFieldInclude,
  getJsonFieldFormats,
  getJsonFieldIncludes,
} from "./decorators";
import type {
  JsonFormatOptions,
  JsonIncludeOptions,
  ObjectMapperOptions,
} from "./types";
import { JsonIncludeType } from "./types";

type TypeHandler = (value: unknown, options?: JsonFormatOptions) => unknown;

const DEFAULT_DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

let options: ObjectMapperOptions = {
  dateFormat: DEFAULT_DATE_FORMAT,
  deep: true,
  include: JsonIncludeType.ALWAYS,
};

const typeHandlers = new Map<Function, TypeHandler>();

/** pad 数字 */
function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

/**
 * 按 Jackson 风格 pattern 格式化 Date。
 * 支持：yyyy MM dd HH mm ss SSS
 */
export function formatDate(
  date: Date,
  pattern = DEFAULT_DATE_FORMAT,
  timezone?: number
): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return String(date);
  }

  let y: number;
  let M: number;
  let d: number;
  let H: number;
  let m: number;
  let s: number;
  let S: number;

  if (timezone !== undefined && Number.isFinite(timezone)) {
    const utc = date.getTime() + date.getTimezoneOffset() * 60_000;
    const shifted = new Date(utc + timezone * 3_600_000);
    y = shifted.getUTCFullYear();
    M = shifted.getUTCMonth() + 1;
    d = shifted.getUTCDate();
    H = shifted.getUTCHours();
    m = shifted.getUTCMinutes();
    s = shifted.getUTCSeconds();
    S = shifted.getUTCMilliseconds();
  } else {
    y = date.getFullYear();
    M = date.getMonth() + 1;
    d = date.getDate();
    H = date.getHours();
    m = date.getMinutes();
    s = date.getSeconds();
    S = date.getMilliseconds();
  }

  return pattern
    .replace(/yyyy/g, String(y))
    .replace(/MM/g, pad(M))
    .replace(/dd/g, pad(d))
    .replace(/HH/g, pad(H))
    .replace(/mm/g, pad(m))
    .replace(/ss/g, pad(s))
    .replace(/SSS/g, pad(S, 3));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isClassInstance(value: unknown): value is object {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date) return false;
  const proto = Object.getPrototypeOf(value);
  return proto && proto !== Object.prototype;
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.length === 0) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (isPlainObject(value) && Object.keys(value).length === 0) return true;
  return false;
}

function isDefaultValue(value: unknown): boolean {
  if (isEmptyValue(value)) return true;
  if (value === 0 || value === false) return true;
  return false;
}

/** 判断字段值是否应按 Include 策略跳过 */
export function shouldOmitByInclude(
  value: unknown,
  include?: JsonIncludeType
): boolean {
  const strategy = include ?? JsonIncludeType.ALWAYS;
  switch (strategy) {
    case JsonIncludeType.NON_NULL:
      return value === null || value === undefined;
    case JsonIncludeType.NON_EMPTY:
      return isEmptyValue(value);
    case JsonIncludeType.NON_DEFAULT:
      return isDefaultValue(value);
    case JsonIncludeType.ALWAYS:
    default:
      return false;
  }
}

function resolveInclude(
  fieldInclude: JsonIncludeOptions | undefined,
  classInclude: JsonIncludeOptions | undefined,
  globalInclude: JsonIncludeType | undefined
): JsonIncludeType {
  return (
    fieldInclude?.value ??
    classInclude?.value ??
    globalInclude ??
    JsonIncludeType.ALWAYS
  );
}

/**
 * 全局 ObjectMapper（对齐 Spring Boot Jackson ObjectMapper）。
 * Application 返回业务数据前会自动走 writeValue。
 */
export const ObjectMapper = {
  /** 覆盖全局配置 */
  configure(patch: ObjectMapperOptions = {}): void {
    options = { ...options, ...patch };
  },

  getOptions(): ObjectMapperOptions {
    return { ...options };
  },

  /** 注册类型处理器，例如 BigInt / 自定义类 */
  registerTypeHandler(type: Function, handler: TypeHandler): void {
    typeHandlers.set(type, handler);
  },

  /** 序列化业务数据（递归处理 Date / @JsonFormat / @JsonInclude） */
  writeValue<T = unknown>(data: T): T {
    return transform(data, undefined, undefined) as T;
  },
};

function transform(
  value: unknown,
  fieldFormat?: JsonFormatOptions,
  parentClassInclude?: JsonIncludeOptions
): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "bigint") {
    return value.toString();
  }

  for (const [type, handler] of typeHandlers) {
    if (value instanceof (type as any)) {
      return handler(value, fieldFormat);
    }
  }

  if (value instanceof Date) {
    const pattern = fieldFormat?.pattern ?? options.dateFormat ?? DEFAULT_DATE_FORMAT;
    return formatDate(value, pattern, fieldFormat?.timezone);
  }

  // MySQL 常见：已是 ISO 字符串的日期字段，若有字段格式则再格式化
  if (typeof value === "string" && fieldFormat?.pattern) {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime()) && looksLikeDateString(value)) {
      return formatDate(asDate, fieldFormat.pattern, fieldFormat.timezone);
    }
  }

  if (!options.deep) return value;

  if (Array.isArray(value)) {
    return value.map((item) => transform(item, undefined, parentClassInclude));
  }

  if (isClassInstance(value)) {
    return transformObject(
      value as Record<string, unknown>,
      value.constructor
    );
  }

  if (isPlainObject(value)) {
    return transformObject(value, undefined);
  }

  return value;
}

function looksLikeDateString(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}/.test(value) ||
    /^\d{4}\/\d{2}\/\d{2}/.test(value) ||
    value.includes("T")
  );
}

function transformObject(
  obj: Record<string, unknown>,
  ctor?: Function
): Record<string, unknown> {
  const formats = ctor ? getJsonFieldFormats(ctor) : [];
  const formatMap = new Map(formats.map((f) => [f.property, f.options]));
  const includes = ctor ? getJsonFieldIncludes(ctor) : [];
  const includeMap = new Map(includes.map((f) => [f.property, f.options]));
  const classInclude = ctor ? getClassJsonInclude(ctor) : undefined;
  const out: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    const raw = obj[key];
    const fieldInclude =
      includeMap.get(key) ?? getGlobalFieldInclude(key);
    const includeType = resolveInclude(
      fieldInclude,
      classInclude,
      options.include
    );
    if (shouldOmitByInclude(raw, includeType)) {
      continue;
    }

    const fieldOpts = formatMap.get(key) ?? getGlobalFieldFormat(key);
    out[key] = transform(raw, fieldOpts, classInclude);
  }
  return out;
}
