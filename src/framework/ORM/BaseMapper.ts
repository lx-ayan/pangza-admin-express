import Db, { type RowDataPacket } from "./Db";
import type { Dialect } from "./dialect";
import { getOrmConfig } from "./config";
import {
  applyEntityFieldFills,
  getEntityFields,
  getEntityIdField,
} from "./entityDecorators";
import { OptimisticLockError } from "./errors";
import { applyInsertFill, applyUpdateFill } from "./fill";
import { hydrateFieldSelects } from "./hydrate";
import { getIdentifierGenerator } from "./identifier";
import { IdType, resolveIdType } from "./IdType";
import { QueryWrapper } from "./QueryWrapper";
import { mapResultRows } from "./resultMap";
import { assertIdent, assertSafeUint } from "./security";
import type {
  IPage,
  MapperOptions,
  PageQuery,
  ResolvedOrmConfig,
  SelectQueryOptions,
} from "./types";

interface MapperRuntime {
  table: string;
  idField: string;
  datasource: string;
  /** 表级显式开关；undefined 表示跟随全局 getOrmConfig() */
  logicDeleteExplicit?: boolean;
  logicDeleteField: string;
  logicDeleteValue: unknown;
  logicNotDeleteValue: unknown;
  optimisticLockExplicit?: boolean;
  versionField: string;
  fill: boolean;
  /** 更新时 null：INCLUDE 写入 / IGNORE 跳过 */
  updateNullStrategy: "INCLUDE" | "IGNORE";
  entity?: Function;
}

/**
 * 通用 Mapper（对齐 MyBatis-Plus BaseMapper）
 * 支持逻辑删除、自动填充、乐观锁（均可配置开关）。
 */
export class BaseMapper<T extends Record<string, any> = Record<string, any>> {
  private readonly opts: MapperRuntime;
  private readonly dialect: Dialect;

  constructor(options: MapperOptions) {
    const global = getOrmConfig();
    const datasource = (options.datasource ?? "default").trim() || "default";
    this.opts = {
      table: assertIdent(options.table),
      idField: assertIdent(options.idField ?? "id"),
      datasource,
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
      updateNullStrategy: options.updateNullStrategy ?? "INCLUDE",
      entity: options.entity,
    };
    this.dialect = Db.getDialect(datasource);
  }

  /** 更新字段是否参与 SET（undefined 永不参与；null 受 updateNullStrategy 控制） */
  private shouldWriteUpdateValue(value: unknown): boolean {
    if (value === undefined) return false;
    if (value === null && this.opts.updateNullStrategy === "IGNORE") {
      return false;
    }
    return true;
  }

  private async query<R = unknown>(
    sql: string,
    params: unknown[] = []
  ): Promise<R> {
    return Db.queryOn<R>(this.opts.datasource, sql, params);
  }

  private async tx<R>(fn: () => Promise<R>): Promise<R> {
    return Db.transactionOn(this.opts.datasource, fn);
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
    return this.dialect.quoteIdent(this.opts.table);
  }

  private idSql() {
    return this.dialect.quoteIdent(this.opts.idField);
  }

  private colSql(name: string) {
    return this.dialect.quoteIdent(assertIdent(name));
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
    const { sql, params } = this.dialect.listColumnsSql(this.opts.table);
    const rows = (await this.query(sql, params)) as RowDataPacket[];
    const names = this.dialect
      .parseColumnNames(rows as Record<string, unknown>[])
      .filter(Boolean);
    this.columnNames = new Set(names);
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
        `[ORM] 表 ${this.opts.table}（数据源 ${this.opts.datasource}）没有逻辑删除列 ${field}。` +
          `请 ALTER TABLE 增加该列，或 @Mapper / table(..., { logicDelete: false })。` +
          `当前表列: ${[...cols].join(", ") || "(空)"}`
      );
    }
  }

  /** 追加未删除条件（不修改调用方 wrapper） */
  private withLogic(wrapper?: QueryWrapper): QueryWrapper {
    const src = wrapper ?? new QueryWrapper(this.dialect);
    if (!this.isLogicDelete() || src.isIgnoreLogicDelete()) {
      return src;
    }
    return src
      .clone()
      .eq(this.opts.logicDeleteField, this.opts.logicNotDeleteValue);
  }

  private hydrateOpts(query?: SelectQueryOptions) {
    if (query?.relations === false) {
      return {
        datasource: this.opts.datasource,
        relations: false as const,
        properties: [] as string[],
      };
    }
    if (Array.isArray(query?.relations)) {
      return {
        datasource: this.opts.datasource,
        relations: query!.relations,
        includeLazy: true,
        properties: query!.relations,
      };
    }
    return { datasource: this.opts.datasource };
  }

  private normalizeListArgs(
    wrapperOrOptions?: QueryWrapper | SelectQueryOptions,
    limitOrOptions?: number | SelectQueryOptions
  ): { wrapper?: QueryWrapper; options: SelectQueryOptions } {
    if (
      wrapperOrOptions &&
      typeof wrapperOrOptions === "object" &&
      !(wrapperOrOptions instanceof QueryWrapper) &&
      ("relations" in wrapperOrOptions || "limit" in wrapperOrOptions)
    ) {
      return { options: wrapperOrOptions as SelectQueryOptions };
    }
    if (typeof limitOrOptions === "number") {
      return {
        wrapper: wrapperOrOptions as QueryWrapper | undefined,
        options: { limit: limitOrOptions },
      };
    }
    return {
      wrapper: wrapperOrOptions as QueryWrapper | undefined,
      options: (limitOrOptions as SelectQueryOptions | undefined) ?? {},
    };
  }

  /** 按主键查询 */
  async selectById(
    id: string | number,
    options?: SelectQueryOptions
  ): Promise<T | null> {
    return this.selectOne(
      new QueryWrapper(this.dialect).eq(this.opts.idField, id),
      options
    );
  }

  /** 条件查询单条 */
  async selectOne(
    wrapper?: QueryWrapper,
    options?: SelectQueryOptions
  ): Promise<T | null> {
    const list = await this.selectList(wrapper, {
      ...options,
      limit: options?.limit ?? 1,
    });
    return list[0] ?? null;
  }

  /** WHERE + GROUP BY + HAVING + ORDER BY + LAST（去多余空格） */
  private fragTail(frag: {
    whereSql: string;
    groupSql: string;
    havingSql: string;
    orderSql: string;
    lastSql: string;
  }): string {
    return `${frag.whereSql} ${frag.groupSql} ${frag.havingSql} ${frag.orderSql} ${frag.lastSql}`
      .replace(/\s+/g, " ")
      .trim();
  }

  /** 有 GROUP BY 时用子查询计组数，否则普通 COUNT */
  private countSqlFromFrag(frag: {
    whereSql: string;
    groupSql: string;
    havingSql: string;
    lastSql: string;
  }): string {
    if (frag.groupSql) {
      const inner = `${frag.whereSql} ${frag.groupSql} ${frag.havingSql} ${frag.lastSql}`
        .replace(/\s+/g, " ")
        .trim();
      return `SELECT COUNT(1) AS cnt FROM (SELECT 1 FROM ${this.tableSql()} ${inner}) AS _g`;
    }
    return `SELECT COUNT(1) AS cnt FROM ${this.tableSql()} ${frag.whereSql} ${frag.lastSql}`
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * 条件查询列表。
   * @param limitOrOptions 数字 limit，或 `{ limit, relations }`
   */
  async selectList(
    wrapper?: QueryWrapper | SelectQueryOptions,
    limitOrOptions?: number | SelectQueryOptions
  ): Promise<T[]> {
    const { wrapper: w, options } = this.normalizeListArgs(
      wrapper,
      limitOrOptions
    );
    await this.assertLogicDeleteColumn();
    const frag = this.withLogic(w).build();
    let sql =
      `SELECT ${frag.selectSql} FROM ${this.tableSql()} ${this.fragTail(frag)}`.trim();
    const params = [...frag.params];
    const limit = options.limit;
    if (limit != null) {
      const n = assertSafeUint(limit, "limit");
      const hasOrder = /\bORDER\s+BY\b/i.test(sql);
      sql = this.dialect.appendLimitOffset(sql, n, 0, hasOrder);
    }
    const rows = mapResultRows(
      (await this.query<RowDataPacket[]>(sql, params)) as T[]
    );
    return hydrateFieldSelects(
      this.opts.entity,
      rows,
      this.hydrateOpts(options)
    );
  }

  /** 条件计数（含 GROUP BY 时返回分组行数） */
  async selectCount(wrapper?: QueryWrapper): Promise<number> {
    await this.assertLogicDeleteColumn();
    const frag = this.withLogic(wrapper).build();
    const sql = this.countSqlFromFrag(frag);
    const rows = await this.query<RowDataPacket[]>(sql, frag.params);
    return Number(rows[0]?.cnt ?? rows[0]?.CNT ?? 0);
  }

  /** 分页查询 */
  async selectPage(
    page: PageQuery = {},
    wrapper?: QueryWrapper,
    options?: SelectQueryOptions
  ): Promise<IPage<T>> {
    const current = assertSafeUint(Math.max(1, page.current ?? 1), "current");
    const size = assertSafeUint(Math.max(1, page.size ?? 10), "size");
    const offset = assertSafeUint((current - 1) * size, "offset");

    await this.assertLogicDeleteColumn();
    const frag = this.withLogic(wrapper).build();
    const countSql = this.countSqlFromFrag(frag);
    let listSql =
      `SELECT ${frag.selectSql} FROM ${this.tableSql()} ${this.fragTail(frag)}`.trim();
    const hasOrder = /\bORDER\s+BY\b/i.test(listSql);
    listSql = this.dialect.appendLimitOffset(listSql, size, offset, hasOrder);

    const [countRows, listRows] = await Promise.all([
      this.query<RowDataPacket[]>(countSql, frag.params),
      this.query<RowDataPacket[]>(listSql, frag.params),
    ]);

    const records = mapResultRows(listRows as T[]);
    return {
      records: await hydrateFieldSelects(
        this.opts.entity,
        records,
        this.hydrateOpts(options)
      ),
      total: Number(countRows[0]?.cnt ?? countRows[0]?.CNT ?? 0),
      current,
      size,
    };
  }

  /** 解析有效主键策略 */
  private resolveIdType(): IdType {
    const idMeta = this.opts.entity
      ? getEntityIdField(this.opts.entity)
      : undefined;
    const annotated = idMeta?.idType ?? IdType.NONE;
    if (annotated !== IdType.NONE) return annotated;
    return resolveIdType(this.cfg().idType ?? IdType.AUTO);
  }

  /** 插入前按 IdType 填充 / 剥离主键 */
  private async applyIdOnInsert(
    row: Record<string, any>,
    entity?: Partial<T>
  ): Promise<void> {
    const idType = this.resolveIdType();
    const col = this.opts.idField;
    const prop =
      this.opts.entity != null
        ? (getEntityIdField(this.opts.entity)?.property ?? col)
        : col;
    const current =
      row[col] !== undefined
        ? row[col]
        : row[prop] !== undefined
          ? row[prop]
          : entity?.[prop as keyof T] ?? entity?.[col as keyof T];

    if (idType === IdType.AUTO) {
      // 数据库自增：不写入 id 列（已有值则保留，兼容显式指定）
      if (current === undefined || current === null || current === "") {
        delete row[col];
        if (prop !== col) delete row[prop];
      }
      return;
    }

    if (idType === IdType.INPUT) {
      return;
    }

    if (current !== undefined && current !== null && current !== "") {
      row[col] = current;
      return;
    }

    const gen = getIdentifierGenerator();
    if (idType === IdType.ASSIGN_ID) {
      row[col] = await gen.nextId(entity);
      return;
    }
    if (idType === IdType.ASSIGN_UUID) {
      row[col] = await gen.nextUUID(entity);
    }
  }

  /** 把生成的主键回写到原始实体 */
  private writeBackId(
    entity: Partial<T>,
    normalized: Record<string, any>,
    insertId: number
  ): void {
    const col = this.opts.idField;
    const prop =
      this.opts.entity != null
        ? (getEntityIdField(this.opts.entity)?.property ?? col)
        : col;
    const idType = this.resolveIdType();
    let value: unknown = normalized[col];
    if (
      (value === undefined || value === null) &&
      idType === IdType.AUTO &&
      insertId
    ) {
      value = insertId;
    }
    if (value === undefined || value === null) return;
    (entity as Record<string, unknown>)[prop] = value;
    if (prop !== col) {
      (entity as Record<string, unknown>)[col] = value;
    }
  }

  /** 插入，返回自增 id（若有）；ASSIGN_* 时尽量回写实体并返回可解析的数字 */
  async insert(entity: Partial<T>): Promise<number> {
    await this.assertLogicDeleteColumn();
    const normalized = await this.prepareInsertRow(entity);
    const insertId = await this.insertOne(normalized);
    this.writeBackId(entity, normalized, insertId);
    const back = (entity as Record<string, unknown>)[this.opts.idField];
    if (insertId) return insertId;
    if (typeof back === "number") return back;
    if (typeof back === "string" && /^\d+$/.test(back)) return Number(back);
    return 0;
  }

  /**
   * 批量插入，返回影响行数。
   * 多行一条 INSERT，按 `orm.batch.insertSize`（默认 200）分批。
   */
  async saveBatch(entities: Array<Partial<T>>): Promise<number> {
    const list = (entities ?? []).filter(
      (item) => item != null && typeof item === "object"
    );
    if (list.length === 0) return 0;

    await this.assertLogicDeleteColumn();
    return this.tx(async () => {
      const rows: Record<string, any>[] = [];
      for (const entity of list) {
        const normalized = await this.prepareInsertRow(entity);
        rows.push(normalized);
        // ASSIGN_* 已写入 normalized，回写实体；AUTO 批量不回填单条 id
        this.writeBackId(entity, normalized, 0);
      }

      const batchSize = Math.max(1, this.cfg().batchInsertSize ?? 200);
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
    await this.applyIdOnInsert(row, entity);
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
    const cols = safeKeys.map((k) => this.dialect.quoteIdent(k)).join(", ");
    const placeholders = safeKeys.map(() => "?").join(", ");
    const values = safeKeys.map((k) => normalized[k]);
    const baseSql = `INSERT INTO ${this.tableSql()} (${cols}) VALUES (${placeholders})`;
    const prepared = this.dialect.prepareInsert(baseSql, this.opts.idField);
    const result = await this.query(prepared.sql, values);
    return this.dialect.extractInsertId(
      result,
      this.opts.idField,
      prepared.returning
    );
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
    const cols = safeKeys.map((k) => this.dialect.quoteIdent(k)).join(", ");
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
    const result = await this.query(sql, values);
    return this.dialect.extractAffectedRows(result);
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
        this.shouldWriteUpdateValue(normalized[k])
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
    const result = await this.query(sql, [...values, ...whereParams]);
    const affected = this.dialect.extractAffectedRows(result);
    if (version !== undefined && affected === 0) {
      throw new OptimisticLockError();
    }
    return affected;
  }

  /**
   * 有主键且库中存在则 updateById，否则 insert。
   * 返回影响行数（insert / update 语义与各自方法一致）。
   */
  async saveOrUpdate(entity: Partial<T>): Promise<number> {
    const id = entity[this.opts.idField as keyof T] as
      | string
      | number
      | null
      | undefined;
    if (id === undefined || id === null || id === "") {
      return this.insert(entity);
    }
    const existing = await this.selectById(id);
    if (!existing) {
      return this.insert(entity);
    }
    return this.updateById(entity);
  }

  /**
   * 按主键批量更新（逐条 updateById，同一事务）。
   * 分批大小取 `orm.batch.updateSize`（默认 200）。
   */
  async updateBatch(entities: Array<Partial<T>>): Promise<number> {
    const list = (entities ?? []).filter(
      (item) => item != null && typeof item === "object"
    );
    if (list.length === 0) return 0;

    const batchSize = Math.max(1, this.cfg().batchUpdateSize ?? 200);
    return this.tx(async () => {
      let affected = 0;
      for (let i = 0; i < list.length; i += batchSize) {
        const chunk = list.slice(i, i + batchSize);
        for (const entity of chunk) {
          affected += await this.updateById(entity);
        }
      }
      return affected;
    });
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
      (k) =>
        k !== this.opts.versionField &&
        this.shouldWriteUpdateValue(normalized[k])
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
    const result = await this.query(sql, [...values, ...params]);
    const affected = this.dialect.extractAffectedRows(result);
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
    return this.deleteByIdsInternal(ids, false);
  }

  /**
   * 按主键物理删除（始终 DELETE，忽略逻辑删除开关）。
   * 用于彻底清除或回收站清空。
   */
  async physicalDeleteById(id: string | number): Promise<number> {
    return this.physicalDeleteByIds([id]);
  }

  /** 按主键批量物理删除 */
  async physicalDeleteByIds(ids: Array<string | number>): Promise<number> {
    return this.deleteByIdsInternal(ids, true);
  }

  /** 条件删除（开启逻辑删除时改为 UPDATE） */
  async delete(wrapper: QueryWrapper): Promise<number> {
    return this.deleteByWrapper(wrapper, false);
  }

  /**
   * 条件物理删除（始终 DELETE）。
   * 必须带 WHERE；不会自动附加「未删除」条件（可删已逻辑删除行）。
   */
  async physicalDelete(wrapper: QueryWrapper): Promise<number> {
    return this.deleteByWrapper(wrapper, true);
  }

  private async deleteByIdsInternal(
    ids: Array<string | number>,
    physical: boolean
  ): Promise<number> {
    const list = (ids ?? []).filter((id) => id !== undefined && id !== null);
    if (list.length === 0) return 0;

    if (!physical) {
      await this.assertLogicDeleteColumn();
    }
    const batchSize = Math.max(1, this.cfg().batchInSize ?? 500);
    return this.tx(async () => {
      let affected = 0;
      for (let i = 0; i < list.length; i += batchSize) {
        const chunk = list.slice(i, i + batchSize);
        const placeholders = chunk.map(() => "?").join(", ");
        if (physical || !this.isLogicDelete()) {
          const sql = `DELETE FROM ${this.tableSql()} WHERE ${this.idSql()} IN (${placeholders})`;
          const result = await this.query(sql, chunk);
          affected += this.dialect.extractAffectedRows(result);
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

  private async deleteByWrapper(
    wrapper: QueryWrapper,
    physical: boolean
  ): Promise<number> {
    if (!physical) {
      await this.assertLogicDeleteColumn();
    }
    const frag = physical
      ? (wrapper ?? new QueryWrapper(this.dialect)).build()
      : this.withLogic(wrapper).build();
    if (!frag.whereSql) {
      throw new Error(
        `${physical ? "physicalDelete" : "delete"} 必须带 WHERE 条件，防止全表删除`
      );
    }
    if (physical || !this.isLogicDelete()) {
      const sql = `DELETE FROM ${this.tableSql()} ${frag.whereSql} ${frag.lastSql}`.trim();
      const result = await this.query(sql, frag.params);
      return this.dialect.extractAffectedRows(result);
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
    const result = await this.query(sql, [...values, ...whereParams]);
    return this.dialect.extractAffectedRows(result);
  }
}
