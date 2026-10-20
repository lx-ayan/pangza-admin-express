/**
 * 数据库方言：引号、占位符、分页、自增回填等差异。
 */
export type DbType = "mysql" | "postgresql" | "sqlserver";

export interface Dialect {
  readonly type: DbType;
  /** 引用标识符（表名 / 列名） */
  quoteIdent(name: string): string;
  /**
   * 将内部统一的 `?` 占位 SQL 转为驱动可执行形式。
   * MySQL / SQL Server 保持 `?`；PostgreSQL 转为 `$1,$2,...`
   */
  convertPlaceholders(sql: string): string;
  /** 追加 LIMIT / OFFSET（或 SQL Server OFFSET FETCH） */
  appendLimitOffset(
    sql: string,
    limit: number,
    offset?: number,
    hasOrderBy?: boolean
  ): string;
  /** 查询表列名的 SQL（参数：tableName） */
  listColumnsSql(table: string): { sql: string; params: unknown[] };
  /** 从 listColumns 结果解析列名 */
  parseColumnNames(rows: Record<string, unknown>[]): string[];
  /** INSERT 后取自增/回填 id；pg 会改写 SQL 加 RETURNING */
  prepareInsert(
    sql: string,
    idColumn: string
  ): { sql: string; returning: boolean };
  extractInsertId(
    result: unknown,
    idColumn: string,
    returning: boolean
  ): number;
  /** 影响行数 */
  extractAffectedRows(result: unknown): number;
}

function replaceQuestionMarks(sql: string, to: (i: number) => string): string {
  let i = 0;
  return sql.replace(/\?/g, () => to(++i));
}

export const MysqlDialect: Dialect = {
  type: "mysql",
  quoteIdent(name) {
    return `\`${name}\``;
  },
  convertPlaceholders(sql) {
    return sql;
  },
  appendLimitOffset(sql, limit, offset = 0) {
    if (offset > 0) return `${sql} LIMIT ${limit} OFFSET ${offset}`;
    return `${sql} LIMIT ${limit}`;
  },
  listColumnsSql(table) {
    return {
      sql: `SHOW COLUMNS FROM ${this.quoteIdent(table)}`,
      params: [],
    };
  },
  parseColumnNames(rows) {
    return rows.map((r) => String(r.Field ?? r.field ?? ""));
  },
  prepareInsert(sql) {
    return { sql, returning: false };
  },
  extractInsertId(result) {
    const header = result as { insertId?: number };
    return Number(header?.insertId ?? 0);
  },
  extractAffectedRows(result) {
    const header = result as { affectedRows?: number };
    return Number(header?.affectedRows ?? 0);
  },
};

export const PostgresqlDialect: Dialect = {
  type: "postgresql",
  quoteIdent(name) {
    return `"${name}"`;
  },
  convertPlaceholders(sql) {
    return replaceQuestionMarks(sql, (i) => `$${i}`);
  },
  appendLimitOffset(sql, limit, offset = 0) {
    if (offset > 0) return `${sql} LIMIT ${limit} OFFSET ${offset}`;
    return `${sql} LIMIT ${limit}`;
  },
  listColumnsSql(table) {
    return {
      sql: `SELECT column_name AS "Field" FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = ?`,
      params: [table],
    };
  },
  parseColumnNames(rows) {
    return rows.map((r) => String(r.Field ?? r.field ?? r.column_name ?? ""));
  },
  prepareInsert(sql, idColumn) {
    return {
      sql: `${sql} RETURNING ${this.quoteIdent(idColumn)}`,
      returning: true,
    };
  },
  extractInsertId(result, idColumn, returning) {
    if (returning && Array.isArray(result) && result[0]) {
      const row = result[0] as Record<string, unknown>;
      return Number(row[idColumn] ?? 0);
    }
    return 0;
  },
  extractAffectedRows(result) {
    if (Array.isArray(result)) return result.length;
    const header = result as { rowCount?: number; affectedRows?: number };
    return Number(header?.rowCount ?? header?.affectedRows ?? 0);
  },
};

export const SqlServerDialect: Dialect = {
  type: "sqlserver",
  quoteIdent(name) {
    return `[${name}]`;
  },
  convertPlaceholders(sql) {
    // node-mssql 对 ? 支持不稳定，统一转 @p1,@p2
    return replaceQuestionMarks(sql, (i) => `@p${i}`);
  },
  appendLimitOffset(sql, limit, offset = 0, hasOrderBy = false) {
    const order = hasOrderBy ? "" : " ORDER BY (SELECT NULL)";
    return `${sql}${order} OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
  },
  listColumnsSql(table) {
    return {
      sql: `SELECT COLUMN_NAME AS [Field] FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ?`,
      params: [table],
    };
  },
  parseColumnNames(rows) {
    return rows.map((r) => String(r.Field ?? r.field ?? r.COLUMN_NAME ?? ""));
  },
  prepareInsert(sql, idColumn) {
    // INSERT INTO t (a) VALUES (@p1) → INSERT INTO t (a) OUTPUT INSERTED.[id] VALUES (@p1)
    const upper = sql.toUpperCase();
    const valuesIdx = upper.lastIndexOf(" VALUES");
    if (valuesIdx < 0) {
      return { sql, returning: false };
    }
    const head = sql.slice(0, valuesIdx);
    const tail = sql.slice(valuesIdx);
    return {
      sql: `${head} OUTPUT INSERTED.${this.quoteIdent(idColumn)}${tail}`,
      returning: true,
    };
  },
  extractInsertId(result, idColumn, returning) {
    if (returning && Array.isArray(result) && result[0]) {
      const row = result[0] as Record<string, unknown>;
      return Number(row[idColumn] ?? 0);
    }
    return 0;
  },
  extractAffectedRows(result) {
    if (Array.isArray(result)) return result.length;
    const header = result as { rowsAffected?: number[]; affectedRows?: number };
    if (Array.isArray(header?.rowsAffected)) {
      return Number(header.rowsAffected[0] ?? 0);
    }
    return Number(header?.affectedRows ?? 0);
  },
};

const DIALECTS: Record<DbType, Dialect> = {
  mysql: MysqlDialect,
  postgresql: PostgresqlDialect,
  sqlserver: SqlServerDialect,
};

export function getDialect(type: DbType | string = "mysql"): Dialect {
  const key = String(type || "mysql").toLowerCase() as DbType;
  const map: Record<string, DbType> = {
    mysql: "mysql",
    mariadb: "mysql",
    postgres: "postgresql",
    postgresql: "postgresql",
    pg: "postgresql",
    mssql: "sqlserver",
    sqlserver: "sqlserver",
    "sql-server": "sqlserver",
  };
  const resolved = map[key] ?? (key as DbType);
  const dialect = DIALECTS[resolved];
  if (!dialect) {
    throw new Error(`不支持的数据库类型: ${type}`);
  }
  return dialect;
}
