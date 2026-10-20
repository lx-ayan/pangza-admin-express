import Db from "./Db";

export { Db };
export { BaseMapper } from "./BaseMapper";
export { table, useTable, clearTableCache } from "./table";
export { QueryWrapper, assertIdent } from "./QueryWrapper";
export {
  TableSearch,
  OperTypeEnum,
  getTableSearchMeta,
  getQueryWrapper,
  getQueryWrapperAndPage,
} from "./tableSearch";
export type {
  OperType,
  TableSearchOptions,
  TableSearchMeta,
  QueryWrapperAndPage,
} from "./tableSearch";
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
export {
  Select,
  Insert,
  Update,
  Delete,
  Param,
  MAPPER_ENTITY_KEY,
} from "./sqlDecorators";
export type { SqlExecuteOptions, SelectOptions } from "./sqlDecorators";
export { Transactional } from "./transactional";
export type { TransactionalOptions } from "./transactional";
export {
  registerFieldSelect,
  getFieldSelects,
  getFieldSelect,
} from "./fieldSelect";
export type { FieldSelectOptions, FieldSelectMeta } from "./fieldSelect";
export {
  hydrateFieldSelects,
  hydrateRelations,
  buildRowParamContext,
} from "./hydrate";
export type {
  HydrateFieldSelectOptions,
  HydrateRelationsOptions,
} from "./hydrate";
export {
  ManyToOne,
  OneToMany,
  ManyToMany,
  getRelations,
  getRelation,
  relationToFieldSelect,
} from "./relation";
export type {
  RelationKind,
  RelationFetch,
  RelationMeta,
  ManyToOneOptions,
  OneToManyOptions,
  ManyToManyOptions,
} from "./relation";
export {
  MapperXml,
  xmlMapper,
  loadXmlMappers,
  ensureXmlMappersLoaded,
  parseMapperXml,
  renderStatementSql,
  evalTest,
  getXmlStatement,
  bootstrapXmlMappers,
  watchXmlMappers,
} from "./xml";
export type { XmlMapperApi, MapperXmlOptions } from "./xml";
export { parseMybatisSql, buildParamContext } from "./sqlTemplate";
export {
  TableName,
  TableId,
  TableField,
  getTableName,
  getEntityFields,
  getEntityIdField,
  getEntityTableMeta,
  applyEntityFieldFills,
} from "./entityDecorators";
export { IdType, resolveIdType } from "./IdType";
export type { IdTypeValue } from "./IdType";
export {
  setIdentifierGenerator,
  getIdentifierGenerator,
  defaultIdentifierGenerator,
} from "./identifier";
export type { IdentifierGenerator } from "./identifier";
export { mapResultRow, mapResultRows } from "./resultMap";
export { getDialect } from "./dialect";
export type { DbType, Dialect } from "./dialect";
export { DataSource } from "./DataSource";
export type { DataSourceConfig } from "./DataSource";
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
  TransactionPropagation,
  SelectQueryOptions,
} from "./types";
export type { ParsedSql } from "./sqlTemplate";
export type {
  FieldFillValue,
  TableFieldOptions,
  TableIdOptions,
  EntityFieldMeta,
  EntityTableMeta,
} from "./entityDecorators";

// 按 YAML 加载 XML Mapper；开启 mapperReload 时监听变更
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { bootstrapXmlMappers, watchXmlMappers } = require("./xml") as {
    bootstrapXmlMappers: () => void;
    watchXmlMappers: () => void;
  };
  bootstrapXmlMappers();
  watchXmlMappers();
} catch (err) {
  console.error("[ORM] XML Mapper 加载失败:", err);
}

// 按 YAML 自动连接默认数据源（失败仅打日志，首次 query 会再试）
void Db.connect().catch((err: Error) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getLogger } = require("@/framework/Logger") as {
      getLogger: (n?: string) => { error: (...a: unknown[]) => void };
    };
    getLogger("ORM").error({ err }, "默认数据源自动连接失败");
  } catch {
    console.error("[ORM] 默认数据源自动连接失败:", err.message);
  }
});

export default Db;
