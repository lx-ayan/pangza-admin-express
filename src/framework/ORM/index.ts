import Db from "./Db";

export { Db };
export { BaseMapper } from "./BaseMapper";
export { table, useTable, clearTableCache } from "./table";
export { QueryWrapper, assertIdent } from "./QueryWrapper";
export {
  assertSafeUint,
  escapeLike,
  assertSafeLastSql,
} from "./security";
export {
  configureOrm,
  getOrmConfig,
  setMetaObjectHandler,
  getMetaObjectHandler,
} from "./config";
export {
  configureSqlLog,
  getSqlLogRuntime,
  renderSqlLog,
  detectSqlType,
  DEFAULT_SQL_LOG_FORMAT,
} from "./sqlLog";
export { OrmError, OptimisticLockError } from "./errors";
export { Select, Insert, Update, Delete, Param, MAPPER_ENTITY_KEY } from "./sqlDecorators";
export { Transactional } from "./transactional";
export {
  registerFieldSelect,
  getFieldSelects,
  getFieldSelect,
} from "./fieldSelect";
export type { FieldSelectOptions, FieldSelectMeta } from "./fieldSelect";
export { hydrateFieldSelects, buildRowParamContext } from "./hydrate";
export type { HydrateFieldSelectOptions } from "./hydrate";
export { parseMybatisSql, buildParamContext } from "./sqlTemplate";
export {
  TableName,
  TableId,
  TableField,
  getTableName,
  getEntityFields,
  getEntityTableMeta,
  applyEntityFieldFills,
} from "./entityDecorators";
export type {
  MysqlConfig,
  MapperOptions,
  MapperTableOptions,
  PageQuery,
  IPage,
  SqlFragment,
  ResolvedOrmConfig,
  MetaObjectHandler,
  SqlLogParts,
  SqlLogInfo,
  SqlLogFormatFn,
} from "./types";
export type { ParsedSql } from "./sqlTemplate";
export type {
  FieldFillValue,
  TableFieldOptions,
  TableIdOptions,
  EntityFieldMeta,
  EntityTableMeta,
} from "./entityDecorators";

// 按 .env 自动连接（失败仅打日志，首次 query 会再试）
void Db.connect().catch((err: Error) => {
  // 此时 Logger 可能尚未 registry，降级 console
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getLogger } = require("@/framework/Logger") as {
      getLogger: (n?: string) => { error: (...a: unknown[]) => void };
    };
    getLogger("MySQL").error({ err }, "自动连接失败");
  } catch {
    console.error("[MySQL] 自动连接失败:", err.message);
  }
});

export default Db;
