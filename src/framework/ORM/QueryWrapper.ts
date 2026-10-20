import type { SqlFragment } from "./types";
import {
  assertIdent,
  assertSafeLastSql,
  escapeLike,
} from "./security";
import { getDialect, type Dialect, type DbType } from "./dialect";

export { assertIdent } from "./security";

type JoinType = "AND" | "OR";

interface Condition {
  join: JoinType;
  sql: string;
  params: unknown[];
}

interface HavingClause {
  sql: string;
  params: unknown[];
}

export interface QueryWrapperOptions {
  /** 方言或数据库类型，影响列名引号；默认 mysql */
  dialect?: Dialect | DbType | string;
}

function resolveInBatchSize(): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getOrmConfig } = require("./config") as {
      getOrmConfig: () => { batchInSize?: number };
    };
    const n = Number(getOrmConfig().batchInSize ?? 500);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 500;
  } catch {
    return 500;
  }
}

/**
 * 条件构造器（对齐 MyBatis-Plus QueryWrapper 常用 API）
 * 列名白名单校验，值一律参数绑定。
 *
 * @example
 * new QueryWrapper().select('id', 'username').eq('status', 1).orderByDesc('id')
 * new QueryWrapper({ dialect: "postgresql" }).eq("status", 1)
 */
export class QueryWrapper {
  private conditions: Condition[] = [];
  private orders: string[] = [];
  private selectColumns: string[] = [];
  private groupColumns: string[] = [];
  private havingClauses: HavingClause[] = [];
  private lastSqlText = "";
  private nextJoin: JoinType = "AND";
  private skipLogicDelete = false;
  private readonly dialect: Dialect;

  constructor(options?: QueryWrapperOptions | Dialect | DbType | string) {
    if (!options) {
      this.dialect = getDialect("mysql");
    } else if (typeof options === "string") {
      this.dialect = getDialect(options);
    } else if (typeof options === "object" && "quoteIdent" in options) {
      this.dialect = options as Dialect;
    } else {
      const d = (options as QueryWrapperOptions).dialect;
      if (d && typeof d === "object" && "quoteIdent" in d) {
        this.dialect = d as Dialect;
      } else {
        this.dialect = getDialect((d as DbType | string | undefined) ?? "mysql");
      }
    }
  }

  getDialect(): Dialect {
    return this.dialect;
  }

  /** 本条查询忽略逻辑删除条件（查回收站等） */
  ignoreLogicDelete(): this {
    this.skipLogicDelete = true;
    return this;
  }

  isIgnoreLogicDelete(): boolean {
    return this.skipLogicDelete;
  }

  /** 复制一份，避免 Mapper 追加逻辑删除时改到调用方 */
  clone(): QueryWrapper {
    const copy = new QueryWrapper(this.dialect);
    (copy as unknown as { conditions: Condition[] }).conditions =
      this.conditions.map((c) => ({
        join: c.join,
        sql: c.sql,
        params: [...c.params],
      }));
    (copy as unknown as { orders: string[] }).orders = [...this.orders];
    (copy as unknown as { selectColumns: string[] }).selectColumns = [
      ...this.selectColumns,
    ];
    (copy as unknown as { groupColumns: string[] }).groupColumns = [
      ...this.groupColumns,
    ];
    (copy as unknown as { havingClauses: HavingClause[] }).havingClauses =
      this.havingClauses.map((h) => ({
        sql: h.sql,
        params: [...h.params],
      }));
    (copy as unknown as { lastSqlText: string }).lastSqlText = this.lastSqlText;
    (copy as unknown as { nextJoin: JoinType }).nextJoin = this.nextJoin;
    copy.skipLogicDelete = this.skipLogicDelete;
    return copy;
  }

  /** 下一条件用 OR 连接 */
  or(): this {
    this.nextJoin = "OR";
    return this;
  }

  /** 下一条件用 AND 连接（默认） */
  and(): this {
    this.nextJoin = "AND";
    return this;
  }

  private add(sql: string, params: unknown[] = []): this {
    this.conditions.push({
      join: this.nextJoin,
      sql,
      params,
    });
    this.nextJoin = "AND";
    return this;
  }

  private col(column: string): string {
    return this.dialect.quoteIdent(assertIdent(column));
  }

  /**
   * 指定查询列；不传则默认 SELECT *
   * @example wrapper.select('id', 'username', 'status')
   */
  select(...columns: string[]): this {
    if (columns.length === 0) {
      this.selectColumns = [];
      return this;
    }
    this.selectColumns = columns.map((c) => this.col(c));
    return this;
  }

  eq(column: string, value: unknown): this {
    return this.add(`${this.col(column)} = ?`, [value]);
  }

  /** field = value OR field IS NULL（兼容历史未填逻辑删除字段的数据） */
  eqOrIsNull(column: string, value: unknown): this {
    const c = this.col(column);
    return this.add(`(${c} = ? OR ${c} IS NULL)`, [value]);
  }

  ne(column: string, value: unknown): this {
    return this.add(`${this.col(column)} <> ?`, [value]);
  }

  gt(column: string, value: unknown): this {
    return this.add(`${this.col(column)} > ?`, [value]);
  }

  ge(column: string, value: unknown): this {
    return this.add(`${this.col(column)} >= ?`, [value]);
  }

  lt(column: string, value: unknown): this {
    return this.add(`${this.col(column)} < ?`, [value]);
  }

  le(column: string, value: unknown): this {
    return this.add(`${this.col(column)} <= ?`, [value]);
  }

  private likePattern(column: string, pattern: string, not = false): this {
    const op = not ? "NOT LIKE" : "LIKE";
    return this.add(
      `${this.col(column)} ${op} ?${this.dialect.likeEscapeClause()}`,
      [pattern]
    );
  }

  /** 模糊查询；已转义 % / _，避免通配符注入 */
  like(column: string, value: string): this {
    return this.likePattern(column, `%${escapeLike(String(value))}%`);
  }

  /** 左模糊：`%value`（对齐 MP likeLeft） */
  likeLeft(column: string, value: string): this {
    return this.likePattern(column, `%${escapeLike(String(value))}`);
  }

  /** 右模糊：`value%`（对齐 MP likeRight） */
  likeRight(column: string, value: string): this {
    return this.likePattern(column, `${escapeLike(String(value))}%`);
  }

  /** `NOT LIKE %value%`（已转义通配符） */
  notLike(column: string, value: string): this {
    return this.likePattern(column, `%${escapeLike(String(value))}%`, true);
  }

  /**
   * EXISTS (子查询)。子查询自行保证安全；参数走绑定。
   * @example wrapper.exists('SELECT 1 FROM role_user ru WHERE ru.user_id = t.id AND ru.role_id = ?', [1])
   */
  exists(sql: string, params: unknown[] = []): this {
    const body = String(sql).trim();
    if (!body) throw new Error("exists() 子查询不能为空");
    return this.add(`EXISTS (${body})`, params);
  }

  /** NOT EXISTS (子查询) */
  notExists(sql: string, params: unknown[] = []): this {
    const body = String(sql).trim();
    if (!body) throw new Error("notExists() 子查询不能为空");
    return this.add(`NOT EXISTS (${body})`, params);
  }

  /**
   * 追加自定义条件片段（参数绑定）。
   * 仅用于无法用 eq/like 表达的括号 OR 等场景；列名须自行保证安全。
   */
  apply(sql: string, params: unknown[] = []): this {
    return this.add(`(${sql})`, params);
  }

  /** 括号分组：fn 内条件作为整体与外层 AND/OR 连接（内层沿用本 Wrapper 方言） */
  nested(fn: (w: QueryWrapper) => void): this {
    const inner = new QueryWrapper(this.dialect);
    fn(inner);
    const frag = inner.build();
    if (!frag.whereSql) return this;
    const body = frag.whereSql.replace(/^WHERE\s+/i, "");
    return this.add(`(${body})`, frag.params);
  }

  /** 大数组按 batchInSize 拆成多个 IN，用 OR / AND 连接 */
  private inChunks(
    column: string,
    values: unknown[],
    not: boolean
  ): this {
    const col = this.col(column);
    const chunkSize = resolveInBatchSize();
    const op = not ? "NOT IN" : "IN";
    const join = not ? " AND " : " OR ";
    if (values.length <= chunkSize) {
      const placeholders = values.map(() => "?").join(", ");
      return this.add(`${col} ${op} (${placeholders})`, values);
    }
    const parts: string[] = [];
    const params: unknown[] = [];
    for (let i = 0; i < values.length; i += chunkSize) {
      const chunk = values.slice(i, i + chunkSize);
      parts.push(`${col} ${op} (${chunk.map(() => "?").join(", ")})`);
      params.push(...chunk);
    }
    return this.add(`(${parts.join(join)})`, params);
  }

  in(column: string, values: unknown[]): this {
    if (!Array.isArray(values)) {
      throw new Error("in() 参数必须是数组");
    }
    if (!values.length) {
      return this.add("1 = 0");
    }
    return this.inChunks(column, values, false);
  }

  /** `NOT IN (...)`；空数组视为永真（不加限制），与 in([]) 永假对称 */
  notIn(column: string, values: unknown[]): this {
    if (!Array.isArray(values)) {
      throw new Error("notIn() 参数必须是数组");
    }
    if (!values.length) {
      return this.add("1 = 1");
    }
    return this.inChunks(column, values, true);
  }

  between(column: string, start: unknown, end: unknown): this {
    return this.add(`${this.col(column)} BETWEEN ? AND ?`, [start, end]);
  }

  notBetween(column: string, start: unknown, end: unknown): this {
    return this.add(`${this.col(column)} NOT BETWEEN ? AND ?`, [start, end]);
  }

  /**
   * 按已注册数据源方言创建 Wrapper（避免默认 mysql 引号用在 PG/MSSQL 上）。
   * @example QueryWrapper.forDatasource("postgresql").eq("status", 1)
   */
  static forDatasource(name = "default"): QueryWrapper {
    // 延迟加载，避免与 Db 循环依赖
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Db = require("./Db").default as {
      getDialect: (n?: string) => Dialect;
    };
    return new QueryWrapper(Db.getDialect(name));
  }

  isNull(column: string): this {
    return this.add(`${this.col(column)} IS NULL`);
  }

  isNotNull(column: string): this {
    return this.add(`${this.col(column)} IS NOT NULL`);
  }

  orderByAsc(column: string): this {
    this.orders.push(`${this.col(column)} ASC`);
    return this;
  }

  orderByDesc(column: string): this {
    this.orders.push(`${this.col(column)} DESC`);
    return this;
  }

  /**
   * GROUP BY 列（白名单标识符）。可多次调用追加。
   * @example wrapper.select("status").groupBy("status")
   */
  groupBy(...columns: string[]): this {
    for (const c of columns) {
      this.groupColumns.push(this.col(c));
    }
    return this;
  }

  /**
   * HAVING 条件（参数绑定）。可多次调用，以 AND 连接。
   * 聚合表达式由调用方书写，列名请自行保证安全。
   * @example wrapper.groupBy("status").having("COUNT(*) > ?", [1])
   */
  having(sql: string, params: unknown[] = []): this {
    const body = String(sql).trim();
    if (!body) throw new Error("having() 条件不能为空");
    this.havingClauses.push({ sql: body, params: [...params] });
    return this;
  }

  /**
   * 追加安全白名单片段（禁止任意 SQL）。
   * 仅允许：LIMIT n [OFFSET m] / FOR UPDATE / LOCK IN SHARE MODE
   */
  last(sql: string): this {
    this.lastSqlText = assertSafeLastSql(sql);
    return this;
  }

  /** 生成 SELECT / WHERE / GROUP BY / HAVING / ORDER BY / LAST 片段 */
  build(): SqlFragment {
    const params: unknown[] = [];
    let whereSql = "";

    if (this.conditions.length > 0) {
      const parts: string[] = [];
      this.conditions.forEach((c, index) => {
        if (index === 0) {
          parts.push(c.sql);
        } else {
          parts.push(`${c.join} ${c.sql}`);
        }
        params.push(...c.params);
      });
      whereSql = `WHERE ${parts.join(" ")}`;
    }

    const groupSql =
      this.groupColumns.length > 0
        ? `GROUP BY ${this.groupColumns.join(", ")}`
        : "";

    let havingSql = "";
    if (this.havingClauses.length > 0) {
      const parts = this.havingClauses.map((h) => {
        params.push(...h.params);
        return h.sql;
      });
      havingSql = `HAVING ${parts.join(" AND ")}`;
    }

    const orderSql =
      this.orders.length > 0 ? `ORDER BY ${this.orders.join(", ")}` : "";

    return {
      selectSql:
        this.selectColumns.length > 0 ? this.selectColumns.join(", ") : "*",
      whereSql,
      groupSql,
      havingSql,
      orderSql,
      lastSql: this.lastSqlText,
      params,
    };
  }
}
