import { BaseMapper } from "./BaseMapper";
import type { MapperOptions, MapperTableOptions } from "./types";

/** 按表配置缓存 Mapper，避免重复 new */
const mapperCache = new Map<string, BaseMapper<any>>();

function normalizeOptions(
  tableName: string,
  idFieldOrOptions?: string | MapperTableOptions
): MapperOptions {
  if (typeof idFieldOrOptions === "string" || idFieldOrOptions === undefined) {
    return { table: tableName, idField: idFieldOrOptions ?? "id" };
  }
  return { table: tableName, idField: "id", ...idFieldOrOptions };
}

function cacheKey(options: MapperOptions): string {
  return JSON.stringify({
    table: options.table,
    idField: options.idField ?? "id",
    logicDelete: options.logicDelete ?? null,
    logicDeleteField: options.logicDeleteField ?? null,
    logicDeleteValue: options.logicDeleteValue ?? null,
    logicNotDeleteValue: options.logicNotDeleteValue ?? null,
    optimisticLock: options.optimisticLock ?? null,
    versionField: options.versionField ?? null,
    fill: options.fill ?? null,
    entity: options.entity?.name ?? null,
  });
}

/**
 * 获取表对应的 BaseMapper（单例缓存）
 *
 * @example
 * await table('user').selectById(1)
 * await table('user', { logicDelete: true }).selectList()
 */
export function table<T extends Record<string, any> = Record<string, any>>(
  tableName: string,
  idFieldOrOptions?: string | MapperTableOptions
): BaseMapper<T> {
  const options = normalizeOptions(tableName, idFieldOrOptions);
  const key = cacheKey(options);
  let mapper = mapperCache.get(key) as BaseMapper<T> | undefined;
  if (!mapper) {
    mapper = new BaseMapper<T>(options);
    mapperCache.set(key, mapper);
  }
  return mapper;
}

/** 清除 Mapper 缓存（一般仅测试用；改全局 ORM 配置后可调用） */
export function clearTableCache(): void {
  mapperCache.clear();
}

/** useTable 别名，语义更贴近 hooks 风格 */
export const useTable = table;

export { normalizeOptions };
