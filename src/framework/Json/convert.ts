import { addBeanKey, getBeanKeys } from "./beanKeys";

export interface ConvertOptions {
  /** 显式指定要拷贝的字段；不传则从目标类/实例推断 */
  fields?: string[];
  /** 跳过 source 中的 undefined */
  ignoreUndefined?: boolean;
  /** 跳过 source 中的 null */
  ignoreNull?: boolean;
}

/**
 * 属性装饰器：声明该字段参与 convert 映射（无其它装饰器时使用）。
 *
 * @example
 * class User {
 *   @JsonProperty() username!: string;
 *   @JsonProperty() password!: string;
 * }
 */
export function JsonProperty(): PropertyDecorator {
  return (target, propertyKey) => {
    addBeanKey((target as object).constructor, String(propertyKey));
  };
}

function resolveKeys(
  Target: Function,
  instance: object,
  fields?: string[]
): string[] {
  if (fields && fields.length > 0) return [...fields];

  const keys = new Set<string>(getBeanKeys(Target));
  for (const k of Object.getOwnPropertyNames(instance)) {
    if (k === "constructor") continue;
    keys.add(k);
  }
  return [...keys];
}

function asRecord(source: unknown): Record<string, unknown> {
  if (source && typeof source === "object" && !Array.isArray(source)) {
    return source as Record<string, unknown>;
  }
  return {};
}

function shouldSkip(value: unknown, options?: ConvertOptions): boolean {
  if (options?.ignoreUndefined && value === undefined) return true;
  if (options?.ignoreNull && value === null) return true;
  return false;
}

/**
 * 对象转换：只保留目标类型上的字段（对齐 BeanUtils / 参数 DTO 投影）。
 *
 * @example
 * convert({ username: 'admin', password: 'x', tags: [] }, User)
 * // => User { username: 'admin', password: 'x' }
 *
 * convert(src, ['username', 'password'])
 * // => { username, password }
 */
export function convert<T extends object>(
  source: unknown,
  Target: new () => T,
  options?: ConvertOptions
): T;
export function convert<T extends object>(
  source: unknown,
  fields: string[],
  options?: ConvertOptions
): T;
export function convert<T extends object>(
  source: unknown,
  targetOrFields: (new () => T) | string[],
  options?: ConvertOptions
): T {
  const src = asRecord(source);

  if (Array.isArray(targetOrFields)) {
    const out: Record<string, unknown> = {};
    for (const key of targetOrFields) {
      if (!(key in src)) continue;
      const val = src[key];
      if (shouldSkip(val, options)) continue;
      out[key] = val;
    }
    return out as T;
  }

  const Target = targetOrFields;
  const instance = new Target();
  const keys = resolveKeys(Target, instance, options?.fields);

  if (keys.length === 0) {
    throw new Error(
      `[convert] ${Target.name || "Target"} 未发现可映射字段。` +
        `请在属性上使用装饰器（如 @JsonProperty / @NotNull / @JsonFormat），` +
        `或传入 options.fields / 字段名数组。`
    );
  }

  for (const key of keys) {
    if (!(key in src)) continue;
    const val = src[key];
    if (shouldSkip(val, options)) continue;
    (instance as Record<string, unknown>)[key] = val;
  }
  return instance;
}

/**
 * 属性拷贝到已有目标对象（对齐 BeanUtils.copyProperties）。
 */
export function copyProperties<T extends object>(
  source: unknown,
  target: T,
  options?: ConvertOptions
): T {
  const src = asRecord(source);
  const ctor = (target as object).constructor;
  const keys = resolveKeys(ctor, target, options?.fields);

  const useKeys =
    keys.length > 0
      ? keys
      : Object.keys(src).filter((k) => typeof (src as any)[k] !== "function");

  for (const key of useKeys) {
    if (!(key in src)) continue;
    const val = src[key];
    if (shouldSkip(val, options)) continue;
    (target as Record<string, unknown>)[key] = val;
  }
  return target;
}

/**
 * 按字段名摘取 plain object（不实例化类）。
 */
export function pick<T extends object = Record<string, unknown>>(
  source: unknown,
  fields: string[],
  options?: ConvertOptions
): T {
  return convert<T>(source, fields, options);
}
