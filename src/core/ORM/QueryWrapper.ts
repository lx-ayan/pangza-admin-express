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
 * new QueryWrapper().eq('status', 1).like('name', 'a').orderByDesc('id')
 */
export class QueryWrapper {
  private conditions: Condition[] = [];
  private orders: string[] = [];
  private lastSqlText = "";
  private nextJoin: JoinType = "AND";

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

  eq(column: string, value: unknown): this {
    return this.add(`${this.col(column)} = ?`, [value]);
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

  /** 生成 WHERE / ORDER BY / LAST 片段 */
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
      whereSql,
      orderSql,
      lastSql: this.lastSqlText,
      params,
    };
  }
}
