import Redis from "./Redis";
import { CACHE_KEY, type CacheableOption, type CacheEvictOption } from "./types";

function defaultSuffix(...args: unknown[]): string {
  try {
    return JSON.stringify(args);
  } catch {
    return String(args.length);
  }
}

function resolveCacheKey(
  target: object,
  propertyKey: string | symbol,
  option: CacheableOption | CacheEvictOption,
  args: unknown[]
): string {
  const ctorName =
    (target as { constructor?: { name?: string } }).constructor?.name ||
    "Anonymous";
  const method = String(propertyKey);
  const prefix = option.key ?? `${CACHE_KEY}${ctorName}.${method}`;
  const gen = option.keyGenerator ?? defaultSuffix;
  const suffix = gen(...args);
  return suffix ? `${prefix}:${suffix}` : prefix;
}

/**
 * 方法结果缓存到 Redis（JSON）。
 * @example
 *   @Cacheable({ ttl: 60 })
 *   async getUser(id: string) { ... }
 */
export function Cacheable(option: CacheableOption = {}): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const original = descriptor.value as
      | ((...args: unknown[]) => unknown)
      | undefined;
    if (typeof original !== "function") return descriptor;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const cacheKey = resolveCacheKey(target, propertyKey, option, args);
      const hit = await Redis.getJSON(cacheKey);
      if (hit !== null) return hit;
      const result = await original.apply(this, args);
      const ttl = option.ttl ?? 60;
      if (result !== undefined) {
        await Redis.setJSON(cacheKey, result, ttl > 0 ? ttl : undefined);
      }
      return result;
    } as typeof descriptor.value;

    return descriptor;
  };
}

/**
 * 方法执行后清除缓存。
 * @example
 *   @CacheEvict({ key: 'cache:UserService.getUser' })
 *   async updateUser(id: string) { ... }
 */
export function CacheEvict(option: CacheEvictOption = {}): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    const original = descriptor.value as
      | ((...args: unknown[]) => unknown)
      | undefined;
    if (typeof original !== "function") return descriptor;

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const result = await original.apply(this, args);
      if (option.allEntries) {
        const ctorName =
          (target as { constructor?: { name?: string } }).constructor?.name ||
          "Anonymous";
        const method = String(propertyKey);
        const prefix = option.key ?? `${CACHE_KEY}${ctorName}.${method}`;
        await Redis.deleteByPrefix(prefix);
      } else {
        const cacheKey = resolveCacheKey(target, propertyKey, option, args);
        await Redis.del(cacheKey);
      }
      return result;
    } as typeof descriptor.value;

    return descriptor;
  };
}
