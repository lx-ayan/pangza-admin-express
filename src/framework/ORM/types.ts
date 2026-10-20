/** 兼容：单库 MySQL 连接配置（也可用作 DataSourceConfig） */
export interface MysqlConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  connectionLimit?: number;
}

/** BaseMapper 表级配置（可覆盖全局 YAML / configureOrm） */
export interface MapperOptions {
  /** 表名 */
  table: string;
  /** 主键，默认 id */
  idField?: string;
  /**
   * 数据源名称（Db.register 的名字），默认 "default"。
   * 多库 / 多数据源时在此指定。
   */
  datasource?: string;
  /** 是否开启逻辑删除 */
  logicDelete?: boolean;
  /** 逻辑删除字段名 */
  logicDeleteField?: string;
  /** 已删除值 */
  logicDeleteValue?: unknown;
  /** 未删除值 */
  logicNotDeleteValue?: unknown;
  /** 是否开启乐观锁 */
  optimisticLock?: boolean;
  /** 版本号字段名 */
  versionField?: string;
  /** 是否自动填充 create/update 字段，默认 true */
  fill?: boolean;
  /**
   * 更新时对 `null` 的策略（`undefined` 始终跳过）：
   * - `INCLUDE`（默认）：写入 NULL
   * - `IGNORE`：跳过 null，不更新该列
   */
  updateNullStrategy?: "INCLUDE" | "IGNORE";
  /**
   * 实体类（带 @TableName / @TableId / @TableField）。
   * 用于读取表字段填充策略 insertFill / updateFill。
   */
  entity?: Function;
}

/** 表级配置（不含 table） */
export type MapperTableOptions = Omit<MapperOptions, "table">;

/** 解析后的全局 ORM 配置 */
export interface ResolvedOrmConfig {
  logicDelete: boolean;
  logicDeleteField: string;
  logicDeleteValue: unknown;
  logicNotDeleteValue: unknown;
  optimisticLock: boolean;
  versionField: string;
  /**
   * 全局主键策略（@TableId type 为 NONE 时使用）。
   * 默认 ASSIGN_ID（雪花字符串）。
   */
  idType?: string;
  /**
   * 查询结果下划线列名转驼峰（对齐 MyBatis mapUnderscoreToCamelCase）。
   * 默认 true。
   */
  mapUnderscoreToCamelCase?: boolean;
  fillCreateTime?: string;
  fillUpdateTime?: string;
  fillCreateBy?: string;
  fillUpdateBy?: string;
  /** 是否打印 SQL 日志，默认 false */
  sqlLog?: boolean;
  /**
   * SQL 日志格式：
   * - 字符串模板，占位符 {time} {type} {sql} {params} {cost}
   * - 或自定义函数 (info) => string
   * 默认：`{time} [{type}] {cost}ms | {sql} | params={params}`
   */
  sqlLogFormat?: string | SqlLogFormatFn;
  /** 控制输出片段开关 */
  sqlLogParts?: SqlLogParts;
  /** SQL 日志级别，默认 info */
  sqlLogLevel?: "trace" | "debug" | "info" | "warn";
  /** saveBatch 每批行数，默认 200 */
  batchInsertSize?: number;
  /** updateBatch 每批实体数，默认 200 */
  batchUpdateSize?: number;
  /** 大 IN 分批（QueryWrapper.in / deleteByIds 等），默认 500 */
  batchInSize?: number;
  /** XML 扫描路径（相对项目根或绝对路径），如 mappers/**\/*.xml；空数组表示不启用 */
  mapperLocations?: string[];
  /** 开发态改 XML 热加载，默认 false */
  mapperReload?: boolean;
}

/** @Transactional 传播行为（对齐 Spring） */
export type TransactionPropagation = "REQUIRED" | "REQUIRES_NEW";

/** SQL 日志各片段开关（时间 / 类型 / 语句 / 参数 / 耗时） */
export interface SqlLogParts {
  time?: boolean;
  type?: boolean;
  sql?: boolean;
  params?: boolean;
  cost?: boolean;
}

/** 单次 SQL 日志上下文 */
export interface SqlLogInfo {
  time: string;
  type: string;
  sql: string;
  params: unknown[];
  paramsText: string;
  cost: number;
  error?: boolean;
}

export type SqlLogFormatFn = (info: SqlLogInfo) => string;

/** 插入 / 更新拦截器（对齐 MyBatis-Plus MetaObjectHandler） */
export interface MetaObjectHandler {
  insert?(entity: Record<string, any>): void | Promise<void>;
  update?(entity: Record<string, any>): void | Promise<void>;
}

/** 分页查询（MyBatis-Plus Page 风格） */
export interface PageQuery {
  current?: number;
  size?: number;
}

/**
 * 查询时关联 / 字段 @Select 填充选项。
 * - `relations` 省略：仅 eager
 * - `false`：不填充关联与字段 @Select
 * - `string[]`：只填充列出的属性（含 lazy 关联）
 */
export interface SelectQueryOptions {
  limit?: number;
  relations?: boolean | string[];
}

/** 分页结果 */
export interface IPage<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
}

/** QueryWrapper SQL 片段 */
export interface SqlFragment {
  selectSql: string;
  whereSql: string;
  /** `GROUP BY ...`，无则空串 */
  groupSql: string;
  /** `HAVING ...`，无则空串；参数已并入 params（接在 WHERE 之后） */
  havingSql: string;
  orderSql: string;
  lastSql: string;
  params: unknown[];
}
