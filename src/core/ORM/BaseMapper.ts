import Db, { type ResultSetHeader, type RowDataPacket } from "./Db";
import { QueryWrapper } from "./QueryWrapper";
import { assertIdent, assertSafeUint } from "./security";
import type { IPage, MapperOptions, PageQuery } from "./types";

/**
 * 通用 Mapper（对齐 MyBatis-Plus BaseMapper）
 * 表名/列名白名单；值参数绑定；LIMIT/OFFSET 仅允许安全整数。
 *
 * @example
 * const userMapper = new BaseMapper<User>({ table: 'sys_user' });
 * await userMapper.selectById(1);
 * await userMapper.selectList(new QueryWrapper().eq('status', 1));
 */
export class BaseMapper<T extends Record<string, any> = Record<string, any>> {
  private readonly table: string;
  private readonly idField: string;

  constructor(options: MapperOptions) {
    this.table = assertIdent(options.table);
    this.idField = assertIdent(options.idField ?? "id");
  }

  private tableSql() {
    return `\`${this.table}\``;
  }

  private idSql() {
    return `\`${this.idField}\``;
  }

  /** 按主键查询 */
  async selectById(id: string | number): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableSql()} WHERE ${this.idSql()} = ? LIMIT 1`;
    const rows = await Db.query<RowDataPacket[]>(sql, [id]);
    return (rows[0] as T) ?? null;
  }

  /** 条件查询单条 */
  async selectOne(wrapper?: QueryWrapper): Promise<T | null> {
    const list = await this.selectList(wrapper, 1);
    return list[0] ?? null;
  }

  /** 条件查询列表 */
  async selectList(wrapper?: QueryWrapper, limit?: number): Promise<T[]> {
    const frag = (wrapper ?? new QueryWrapper()).build();
    let sql = `SELECT * FROM ${this.tableSql()} ${frag.whereSql} ${frag.orderSql} ${frag.lastSql}`.trim();
    const params = [...frag.params];
    if (limit != null) {
      // LIMIT 使用校验后的字面量，避免占位符兼容问题，且杜绝注入
      sql += ` LIMIT ${assertSafeUint(limit, "limit")}`;
    }
    const rows = await Db.query<RowDataPacket[]>(sql, params);
    return rows as T[];
  }

  /** 条件计数 */
  async selectCount(wrapper?: QueryWrapper): Promise<number> {
    const frag = (wrapper ?? new QueryWrapper()).build();
    const sql = `SELECT COUNT(1) AS cnt FROM ${this.tableSql()} ${frag.whereSql} ${frag.lastSql}`.trim();
    const rows = await Db.query<RowDataPacket[]>(sql, frag.params);
    return Number(rows[0]?.cnt ?? 0);
  }

  /** 分页查询 */
  async selectPage(
    page: PageQuery = {},
    wrapper?: QueryWrapper
  ): Promise<IPage<T>> {
    const current = assertSafeUint(Math.max(1, page.current ?? 1), "current");
    const size = assertSafeUint(Math.max(1, page.size ?? 10), "size");
    const offset = assertSafeUint((current - 1) * size, "offset");

    const frag = (wrapper ?? new QueryWrapper()).build();
    const whereOrder = `${frag.whereSql} ${frag.orderSql} ${frag.lastSql}`.trim();

    const countSql = `SELECT COUNT(1) AS cnt FROM ${this.tableSql()} ${frag.whereSql} ${frag.lastSql}`.trim();
    const listSql = `SELECT * FROM ${this.tableSql()} ${whereOrder} LIMIT ${size} OFFSET ${offset}`.trim();

    const [countRows, listRows] = await Promise.all([
      Db.query<RowDataPacket[]>(countSql, frag.params),
      Db.query<RowDataPacket[]>(listSql, frag.params),
    ]);

    return {
      records: listRows as T[],
      total: Number(countRows[0]?.cnt ?? 0),
      current,
      size,
    };
  }

  /** 插入，返回自增 id（若有） */
  async insert(entity: Partial<T>): Promise<number> {
    const keys = Object.keys(entity).filter(
      (k) => entity[k as keyof T] !== undefined
    );
    if (keys.length === 0) {
      throw new Error("insert 实体不能为空");
    }
    const safeKeys = keys.map(assertIdent);
    const cols = safeKeys.map((k) => `\`${k}\``).join(", ");
    const placeholders = safeKeys.map(() => "?").join(", ");
    const values = safeKeys.map((k) => entity[k as keyof T]);
    const sql = `INSERT INTO ${this.tableSql()} (${cols}) VALUES (${placeholders})`;
    const result = await Db.query<ResultSetHeader>(sql, values);
    return Number(result.insertId ?? 0);
  }

  /** 按主键更新（忽略 undefined 字段） */
  async updateById(entity: Partial<T>): Promise<number> {
    const id = entity[this.idField as keyof T];
    if (id === undefined || id === null) {
      throw new Error(`updateById 缺少主键 ${this.idField}`);
    }
    const keys = Object.keys(entity).filter(
      (k) => k !== this.idField && entity[k as keyof T] !== undefined
    );
    if (keys.length === 0) return 0;
    const safeKeys = keys.map(assertIdent);
    const sets = safeKeys.map((k) => `\`${k}\` = ?`).join(", ");
    const values = safeKeys.map((k) => entity[k as keyof T]);
    const sql = `UPDATE ${this.tableSql()} SET ${sets} WHERE ${this.idSql()} = ?`;
    const result = await Db.query<ResultSetHeader>(sql, [...values, id]);
    return Number(result.affectedRows ?? 0);
  }

  /** 条件更新 */
  async update(entity: Partial<T>, wrapper: QueryWrapper): Promise<number> {
    const frag = wrapper.build();
    if (!frag.whereSql) {
      throw new Error("update 必须带 WHERE 条件，防止全表更新");
    }
    const keys = Object.keys(entity).filter(
      (k) => entity[k as keyof T] !== undefined
    );
    if (keys.length === 0) return 0;
    const safeKeys = keys.map(assertIdent);
    const sets = safeKeys.map((k) => `\`${k}\` = ?`).join(", ");
    const values = safeKeys.map((k) => entity[k as keyof T]);
    const sql = `UPDATE ${this.tableSql()} SET ${sets} ${frag.whereSql} ${frag.lastSql}`.trim();
    const result = await Db.query<ResultSetHeader>(sql, [
      ...values,
      ...frag.params,
    ]);
    return Number(result.affectedRows ?? 0);
  }

  /** 按主键删除 */
  async deleteById(id: string | number): Promise<number> {
    const sql = `DELETE FROM ${this.tableSql()} WHERE ${this.idSql()} = ?`;
    const result = await Db.query<ResultSetHeader>(sql, [id]);
    return Number(result.affectedRows ?? 0);
  }

  /** 条件删除 */
  async delete(wrapper: QueryWrapper): Promise<number> {
    const frag = wrapper.build();
    if (!frag.whereSql) {
      throw new Error("delete 必须带 WHERE 条件，防止全表删除");
    }
    const sql = `DELETE FROM ${this.tableSql()} ${frag.whereSql} ${frag.lastSql}`.trim();
    const result = await Db.query<ResultSetHeader>(sql, frag.params);
    return Number(result.affectedRows ?? 0);
  }
}
