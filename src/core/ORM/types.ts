/** MySQL 连接配置 */
export interface MysqlConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  connectionLimit?: number;
}

/** BaseMapper 表元数据 */
export interface MapperOptions {
  /** 表名，仅允许字母数字下划线 */
  table: string;
  /** 主键字段，默认 id */
  idField?: string;
}

/** 分页入参（对齐 MyBatis-Plus Page） */
export interface PageQuery {
  /** 当前页，从 1 开始 */
  current?: number;
  /** 每页条数 */
  size?: number;
}

/** 分页结果 */
export interface IPage<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
}

/** QueryWrapper 生成的 WHERE / ORDER / LAST 片段 */
export interface SqlFragment {
  whereSql: string;
  orderSql: string;
  lastSql: string;
  params: unknown[];
}
