import type { SqlFragment } from "./types";
import {
  assertIdent,
  assertSafeLastSql,
  escapeLike,
} from "./security";

export { assertIdent } from "./security";

type JoinType = "AND" | "OR";

interface Condition {
  join: JoinType;
  sql: string;
  params: unknown[];
}

/**
 * 条件构造器（对齐 MyBatis-Plus QueryWrapper 常用 API）
 * 列名白名单校验，值一律参数绑定。
 *
 * @example
 * new QueryWrapper().select('id', 'username').eq('status', 1).orderByDesc('id')
 */
export class QueryWrapper {
  private conditions: Condition[] = [];
  private orders: string[] = [];
  private selectColumns: string[] = [];
  private lastSqlText = "";
  private nextJoin: JoinType = "AND";
  private skipLogicDelete = false;

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
    const copy = new QueryWrapper();
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
    return `\`${assertIdent(column)}\``;
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

  /** 模糊查询；已转义 % / _，避免通配符注入 */
  like(column: string, value: string): this {
    return this.add(`${this.col(column)} LIKE ? ESCAPE '\\\\'`, [
      `%${escapeLike(String(value))}%`,
    ]);
  }

  /**
   * 追加自定义条件片段（参数绑定）。
   * 仅用于无法用 eq/like 表达的括号 OR 等场景；列名须自行保证安全。
   */
  apply(sql: string, params: unknown[] = []): this {
    return this.add(`(${sql})`, params);
  }

  /** 括号分组：fn 内条件作为整体与外层 AND/OR 连接 */
  nested(fn: (w: QueryWrapper) => void): this {
    const inner = new QueryWrapper();
    fn(inner);
    const frag = inner.build();
    if (!frag.whereSql) return this;
    const body = frag.whereSql.replace(/^WHERE\s+/i, "");
    return this.add(`(${body})`, frag.params);
  }

  in(column: string, values: unknown[]): this {
    if (!Array.isArray(values)) {
      throw new Error("in() 参数必须是数组");
    }
    if (!values.length) {
      return this.add("1 = 0");
    }
    const placeholders = values.map(() => "?").join(", ");
    return this.add(`${this.col(column)} IN (${placeholders})`, values);
  }

  between(column: string, start: unknown, end: unknown): this {
    return this.add(`${this.col(column)} BETWEEN ? AND ?`, [start, end]);
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
   * 追加安全白名单片段（禁止任意 SQL）。
   * 仅允许：LIMIT n [OFFSET m] / FOR UPDATE / LOCK IN SHARE MODE
   */
  last(sql: string): this {
    this.lastSqlText = assertSafeLastSql(sql);
    return this;
  }

  /** 生成 SELECT / WHERE / ORDER BY / LAST 片段 */
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

    const orderSql =
      this.orders.length > 0 ? `ORDER BY ${this.orders.join(", ")}` : "";

    return {
      selectSql:
        this.selectColumns.length > 0 ? this.selectColumns.join(", ") : "*",
      whereSql,
      orderSql,
      lastSql: this.lastSqlText,
      params,
    };
  }
}
