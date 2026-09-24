import Db, { type ResultSetHeader, type RowDataPacket } from "./Db";
import { getOrmConfig } from "./config";
import { applyEntityFieldFills, getEntityFields } from "./entityDecorators";
import { OptimisticLockError } from "./errors";
import { applyInsertFill, applyUpdateFill } from "./fill";
import { hydrateFieldSelects } from "./hydrate";
import { QueryWrapper } from "./QueryWrapper";
import { assertIdent, assertSafeUint } from "./security";
import type {
  IPage,
  MapperOptions,
  PageQuery,
  ResolvedOrmConfig,
} from "./types";

interface MapperRuntime {
  table: string;
  idField: string;
  /** 表级显式开关；undefined 表示跟随全局 getOrmConfig() */
  logicDeleteExplicit?: boolean;
  logicDeleteField: string;
  logicDeleteValue: unknown;
  logicNotDeleteValue: unknown;
  optimisticLockExplicit?: boolean;
  versionField: string;
  fill: boolean;
  entity?: Function;
}

/**
 * 通用 Mapper（对齐 MyBatis-Plus BaseMapper）
 * 支持逻辑删除、自动填充、乐观锁（均可配置开关）。
 */
export class BaseMapper<T extends Record<string, any> = Record<string, any>> {
  private readonly opts: MapperRuntime;

  constructor(options: MapperOptions) {
    const global = getOrmConfig();
    this.opts = {
      table: assertIdent(options.table),
      idField: assertIdent(options.idField ?? "id"),
      logicDeleteExplicit: options.logicDelete,
      logicDeleteField: assertIdent(
        options.logicDeleteField ?? global.logicDeleteField
      ),
      logicDeleteValue:
        options.logicDeleteValue ?? global.logicDeleteValue,
      logicNotDeleteValue:
        options.logicNotDeleteValue ?? global.logicNotDeleteValue,
      optimisticLockExplicit: options.optimisticLock,
      versionField: assertIdent(
        options.versionField ?? global.versionField
      ),
      fill: options.fill ?? true,
      entity: options.entity,
    };
  }

  private cfg(): ResolvedOrmConfig {
    return getOrmConfig();
  }

  /** 是否启用逻辑删除（表级优先，否则读全局） */
  private isLogicDelete(): boolean {
    return this.opts.logicDeleteExplicit ?? this.cfg().logicDelete;
  }

  /** 是否启用乐观锁（表级优先，否则读全局） */
  private isOptimisticLock(): boolean {
    return this.opts.optimisticLockExplicit ?? this.cfg().optimisticLock;
  }

  /** 未删除条件（对齐 MyBatis-Plus：字段 = 未删除值） */
  private notDeletedClause(): { sql: string; params: unknown[] } {
    const col = this.colSql(this.opts.logicDeleteField);
    return {
      sql: `${col} = ?`,
      params: [this.opts.logicNotDeleteValue],
    };
  }

  private tableSql() {
    return `\`${this.opts.table}\``;
  }

  private idSql() {
    return `\`${this.opts.idField}\``;
  }

  private colSql(name: string) {
    return `\`${assertIdent(name)}\``;
  }

  /**
   * 把实体属性名映射为列名，并去掉 exist:false 字段，
   * 避免 createTime / create_time 双键写入 SQL。
   */
  private normalizeEntityRow(row: Record<string, any>): Record<string, any> {
    if (!this.opts.entity) return row;
    const fields = getEntityFields(this.opts.entity);
    if (!fields.length) return row;
    const out: Record<string, any> = { ...row };
    for (const f of fields) {
      if (!f.exist) {
        delete out[f.property];
        delete out[f.column];
        continue;
      }
      if (
        f.property !== f.column &&
        out[f.property] !== undefined &&
        out[f.column] === undefined
      ) {
        out[f.column] = out[f.property];
      }
      if (f.property !== f.column) {
        delete out[f.property];
      }
    }
    return out;
  }

  private columnNames: Set<string> | null = null;

  private async getColumnNames(): Promise<Set<string>> {
    if (this.columnNames) return this.columnNames;
    const rows = await Db.query<RowDataPacket[]>(
      `SHOW COLUMNS FROM ${this.tableSql()}`
    );
    this.columnNames = new Set(rows.map((r) => String(r.Field)));
    return this.columnNames;
  }

  /** 表上不存在的自动填充字段直接丢掉，避免 Unknown column */
  private async stripMissingFillFields(row: Record<string, any>): Promise<void> {
    const cols = await this.getColumnNames();
    const cfg = this.cfg();
    for (const field of [
      cfg.fillCreateTime,
      cfg.fillUpdateTime,
      cfg.fillCreateBy,
      cfg.fillUpdateBy,
    ]) {
      if (field && row[field] !== undefined && !cols.has(field)) {
        delete row[field];
      }
    }
  }

  private async assertLogicDeleteColumn(): Promise<void> {
    if (!this.isLogicDelete()) return;
    const cols = await this.getColumnNames();
    const field = this.opts.logicDeleteField;
    if (!cols.has(field)) {
      throw new Error(
        `[ORM] 表 \`${this.opts.table}\` 没有逻辑删除字段 \`${field}\`。请先加列，或在 @Mapper 上设置 logicDelete: false`
      );
    }
  }

  /** 追加未删除条件（不修改调用方 wrapper） */
  private withLogic(wrapper?: QueryWrapper): QueryWrapper {
    const src = wrapper ?? new QueryWrapper();
    if (!this.isLogicDelete() || src.isIgnoreLogicDelete()) {
      return src;
    }
    return src
      .clone()
      .eq(this.opts.logicDeleteField, this.opts.logicNotDeleteValue);
  }

  /** 按主键查询 */
  async selectById(id: string | number): Promise<T | null> {
    return this.selectOne(
      new QueryWrapper().eq(this.opts.idField, id)
    );
  }

  /** 条件查询单条 */
  async selectOne(wrapper?: QueryWrapper): Promise<T | null> {
    const list = await this.selectList(wrapper, 1);
    return list[0] ?? null;
  }

  /** 条件查询列表 */
  async selectList(wrapper?: QueryWrapper, limit?: number): Promise<T[]> {
    await this.assertLogicDeleteColumn();
    const frag = this.withLogic(wrapper).build();
    let sql = `SELECT ${frag.selectSql} FROM ${this.tableSql()} ${frag.whereSql} ${frag.orderSql} ${frag.lastSql}`.trim();
    const params = [...frag.params];
    if (limit != null) {
      sql += ` LIMIT ${assertSafeUint(limit, "limit")}`;
    }
    const rows = await Db.query<RowDataPacket[]>(sql, params);
    return hydrateFieldSelects(this.opts.entity, rows as T[]);
  }

  /** 条件计数 */
  async selectCount(wrapper?: QueryWrapper): Promise<number> {
    await this.assertLogicDeleteColumn();
    const frag = this.withLogic(wrapper).build();
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

    await this.assertLogicDeleteColumn();
    const frag = this.withLogic(wrapper).build();
    const whereOrder = `${frag.whereSql} ${frag.orderSql} ${frag.lastSql}`.trim();

    const countSql = `SELECT COUNT(1) AS cnt FROM ${this.tableSql()} ${frag.whereSql} ${frag.lastSql}`.trim();
    const listSql = `SELECT ${frag.selectSql} FROM ${this.tableSql()} ${whereOrder} LIMIT ${size} OFFSET ${offset}`.trim();

    const [countRows, listRows] = await Promise.all([
      Db.query<RowDataPacket[]>(countSql, frag.params),
      Db.query<RowDataPacket[]>(listSql, frag.params),
    ]);

    return {
      records: await hydrateFieldSelects(this.opts.entity, listRows as T[]),
      total: Number(countRows[0]?.cnt ?? 0),
      current,
      size,
    };
  }

  /** 插入，返回自增 id（若有） */
  async insert(entity: Partial<T>): Promise<number> {
    await this.assertLogicDeleteColumn();
    const normalized = await this.prepareInsertRow(entity);
    return this.insertOne(normalized);
  }

  /**
   * 批量插入，返回影响行数。
   * 多行一条 INSERT，内部按 200 条分批，避免单条 SQL 过大。
   */
  async saveBatch(entities: Array<Partial<T>>): Promise<number> {
    const list = (entities ?? []).filter(
      (item) => item != null && typeof item === "object"
    );
    if (list.length === 0) return 0;

    await this.assertLogicDeleteColumn();
    return Db.transaction(async () => {
      const rows: Record<string, any>[] = [];
      for (const entity of list) {
        rows.push(await this.prepareInsertRow(entity));
      }

      const batchSize = 200;
      let affected = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        affected += await this.insertMany(rows.slice(i, i + batchSize));
      }
      return affected;
    });
  }

  private async prepareInsertRow(
    entity: Partial<T>
  ): Promise<Record<string, any>> {
    const row = { ...entity } as Record<string, any>;
    await applyInsertFill(row, this.cfg(), this.opts.fill);
    await applyEntityFieldFills(this.opts.entity, row, "insert");
    await this.stripMissingFillFields(row);
    const normalized = this.normalizeEntityRow(row);

    if (
      this.isLogicDelete() &&
      normalized[this.opts.logicDeleteField] === undefined
    ) {
      normalized[this.opts.logicDeleteField] = this.opts.logicNotDeleteValue;
    }
    if (
      this.isOptimisticLock() &&
      normalized[this.opts.versionField] === undefined
    ) {
      normalized[this.opts.versionField] = 1;
    }
    return normalized;
  }

  private async insertOne(normalized: Record<string, any>): Promise<number> {
    const keys = Object.keys(normalized).filter(
      (k) => normalized[k] !== undefined
    );
    if (keys.length === 0) {
      throw new Error("insert 实体不能为空");
    }
    const safeKeys = keys.map(assertIdent);
    const cols = safeKeys.map((k) => `\`${k}\``).join(", ");
    const placeholders = safeKeys.map(() => "?").join(", ");
    const values = safeKeys.map((k) => normalized[k]);
    const sql = `INSERT INTO ${this.tableSql()} (${cols}) VALUES (${placeholders})`;
    const result = await Db.query<ResultSetHeader>(sql, values);
    return Number(result.insertId ?? 0);
  }

  /** 多行同一列集合；缺省列写 NULL */
  private async insertMany(rows: Record<string, any>[]): Promise<number> {
    const keySet = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (row[key] !== undefined) keySet.add(key);
      }
    }
    const keys = [...keySet];
    if (keys.length === 0) {
      throw new Error("saveBatch 实体不能为空");
    }
    const safeKeys = keys.map(assertIdent);
    const cols = safeKeys.map((k) => `\`${k}\``).join(", ");
    const rowPlaceholder = `(${safeKeys.map(() => "?").join(", ")})`;
    const values: unknown[] = [];
    for (const row of rows) {
      for (const key of safeKeys) {
        values.push(row[key] === undefined ? null : row[key]);
      }
    }
    const sql = `INSERT INTO ${this.tableSql()} (${cols}) VALUES ${rows
      .map(() => rowPlaceholder)
      .join(", ")}`;
    const result = await Db.query<ResultSetHeader>(sql, values);
    return Number(result.affectedRows ?? 0);
  }

  /** 按主键更新（忽略 undefined 字段） */
  async updateById(entity: Partial<T>): Promise<number> {
    const id = entity[this.opts.idField as keyof T];
    if (id === undefined || id === null) {
      throw new Error(`updateById 缺少主键 ${this.opts.idField}`);
    }
    const row = { ...entity } as Record<string, any>;
    await applyUpdateFill(row, this.cfg(), this.opts.fill);
    await applyEntityFieldFills(this.opts.entity, row, "update");
    await this.stripMissingFillFields(row);
    const normalized = this.normalizeEntityRow(row);
    await this.assertLogicDeleteColumn();

    const version =
      this.isOptimisticLock() &&
      normalized[this.opts.versionField] !== undefined
        ? normalized[this.opts.versionField]
        : undefined;

    const keys = Object.keys(normalized).filter(
      (k) =>
        k !== this.opts.idField &&
        k !== this.opts.versionField &&
        normalized[k] !== undefined
    );

    const sets: string[] = keys.map((k) => `${this.colSql(k)} = ?`);
    const values: unknown[] = keys.map((k) => normalized[k]);

    if (version !== undefined) {
      sets.push(
        `${this.colSql(this.opts.versionField)} = ${this.colSql(this.opts.versionField)} + 1`
      );
    }

    if (sets.length === 0) return 0;

    let where = `${this.idSql()} = ?`;
    const whereParams: unknown[] = [id];
    if (version !== undefined) {
      where += ` AND ${this.colSql(this.opts.versionField)} = ?`;
      whereParams.push(version);
    }
    if (this.isLogicDelete()) {
      const nd = this.notDeletedClause();
      where += ` AND ${nd.sql}`;
      whereParams.push(...nd.params);
    }

    const sql = `UPDATE ${this.tableSql()} SET ${sets.join(", ")} WHERE ${where}`;
    const result = await Db.query<ResultSetHeader>(sql, [
      ...values,
      ...whereParams,
    ]);
    const affected = Number(result.affectedRows ?? 0);
    if (version !== undefined && affected === 0) {
      throw new OptimisticLockError();
    }
    return affected;
  }

  /** 条件更新 */
  async update(entity: Partial<T>, wrapper: QueryWrapper): Promise<number> {
    await this.assertLogicDeleteColumn();
    const frag = this.withLogic(wrapper).build();
    if (!frag.whereSql) {
      throw new Error("update 必须带 WHERE 条件，防止全表更新");
    }
    const row = { ...entity } as Record<string, any>;
    await applyUpdateFill(row, this.cfg(), this.opts.fill);
    await applyEntityFieldFills(this.opts.entity, row, "update");
    await this.stripMissingFillFields(row);
    const normalized = this.normalizeEntityRow(row);

    const version =
      this.isOptimisticLock() &&
      normalized[this.opts.versionField] !== undefined
        ? normalized[this.opts.versionField]
        : undefined;

    const keys = Object.keys(normalized).filter(
      (k) => k !== this.opts.versionField && normalized[k] !== undefined
    );
    const sets: string[] = keys.map((k) => `${this.colSql(k)} = ?`);
    const values: unknown[] = keys.map((k) => normalized[k]);
    if (version !== undefined) {
      sets.push(
        `${this.colSql(this.opts.versionField)} = ${this.colSql(this.opts.versionField)} + 1`
      );
    }
    if (sets.length === 0) return 0;

    let whereSql = frag.whereSql;
    const params = [...frag.params];
    if (version !== undefined) {
      whereSql += ` AND ${this.colSql(this.opts.versionField)} = ?`;
      params.push(version);
    }

    const sql = `UPDATE ${this.tableSql()} SET ${sets.join(", ")} ${whereSql} ${frag.lastSql}`.trim();
    const result = await Db.query<ResultSetHeader>(sql, [
      ...values,
      ...params,
    ]);
    const affected = Number(result.affectedRows ?? 0);
    if (version !== undefined && affected === 0) {
      throw new OptimisticLockError();
    }
    return affected;
  }

  /** 按主键删除（开启逻辑删除时改为 UPDATE） */
  async deleteById(id: string | number): Promise<number> {
    return this.deleteByIds([id]);
  }

  /**
   * 按主键批量删除，返回影响行数。
   * 开启逻辑删除时一条 UPDATE ... IN (...)，否则物理 DELETE。
   */
  async deleteByIds(ids: Array<string | number>): Promise<number> {
    const list = (ids ?? []).filter((id) => id !== undefined && id !== null);
    if (list.length === 0) return 0;

    await this.assertLogicDeleteColumn();
    const batchSize = 500;
    return Db.transaction(async () => {
      let affected = 0;
      for (let i = 0; i < list.length; i += batchSize) {
        const chunk = list.slice(i, i + batchSize);
        const placeholders = chunk.map(() => "?").join(", ");
        if (!this.isLogicDelete()) {
          const sql = `DELETE FROM ${this.tableSql()} WHERE ${this.idSql()} IN (${placeholders})`;
          const result = await Db.query<ResultSetHeader>(sql, chunk);
          affected += Number(result.affectedRows ?? 0);
          continue;
        }
        const nd = this.notDeletedClause();
        affected += await this.logicDeleteBy(
          `${this.idSql()} IN (${placeholders}) AND ${nd.sql}`,
          [...chunk, ...nd.params]
        );
      }
      return affected;
    });
  }

  /** 条件删除（开启逻辑删除时改为 UPDATE） */
  async delete(wrapper: QueryWrapper): Promise<number> {
    await this.assertLogicDeleteColumn();
    const frag = this.withLogic(wrapper).build();
    if (!frag.whereSql) {
      throw new Error("delete 必须带 WHERE 条件，防止全表删除");
    }
    if (!this.isLogicDelete()) {
      const sql = `DELETE FROM ${this.tableSql()} ${frag.whereSql} ${frag.lastSql}`.trim();
      const result = await Db.query<ResultSetHeader>(sql, frag.params);
      return Number(result.affectedRows ?? 0);
    }
    return this.logicDeleteBy(
      frag.whereSql.replace(/^WHERE\s+/i, ""),
      frag.params
    );
  }

  private async logicDeleteBy(
    whereBody: string,
    whereParams: unknown[]
  ): Promise<number> {
    const patch: Record<string, any> = {
      [this.opts.logicDeleteField]: this.opts.logicDeleteValue,
    };
    await applyUpdateFill(patch, this.cfg(), this.opts.fill);
    await applyEntityFieldFills(this.opts.entity, patch, "update");
    await this.stripMissingFillFields(patch);

    const keys = Object.keys(patch).filter((k) => patch[k] !== undefined);
    const sets = keys.map((k) => `${this.colSql(k)} = ?`).join(", ");
    const values = keys.map((k) => patch[k]);
    const sql = `UPDATE ${this.tableSql()} SET ${sets} WHERE ${whereBody}`;
    const result = await Db.query<ResultSetHeader>(sql, [
      ...values,
      ...whereParams,
    ]);
    return Number(result.affectedRows ?? 0);
  }
}
