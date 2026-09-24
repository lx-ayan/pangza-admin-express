import Db, { type RowDataPacket } from "./Db";
import { getEntityFields } from "./entityDecorators";
import {
  getFieldSelects,
  type FieldSelectMeta,
} from "./fieldSelect";
import { parseMybatisSql } from "./sqlTemplate";

export interface HydrateFieldSelectOptions {
  /** 额外递归层数上限 */
  maxDepth?: number;
  /** 包含 eager:false 的字段（默认只填 eager） */
  includeLazy?: boolean;
  /** 只填充指定属性 */
  properties?: string[];
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * 把父行做成 SQL 参数上下文：同时提供属性名 / 列名 / camel / snake，
 * 便于 #{id}、#{parentId}、#{parent_id} 都能取到值。
 */
export function buildRowParamContext(
  row: Record<string, unknown>,
  entity?: Function
): Record<string, unknown> {
  const ctx: Record<string, unknown> = { ...row };

  for (const [k, v] of Object.entries(row)) {
    ctx[snakeToCamel(k)] = v;
    ctx[camelToSnake(k)] = v;
  }

  if (entity) {
    for (const f of getEntityFields(entity)) {
      const val =
        row[f.property] !== undefined ? row[f.property] : row[f.column];
      if (val !== undefined) {
        ctx[f.property] = val;
        ctx[f.column] = val;
      }
    }
  }

  return ctx;
}

function pickColumn(
  rows: Record<string, unknown>[],
  column: string
): unknown[] {
  return rows.map((r) => {
    if (Object.prototype.hasOwnProperty.call(r, column)) return r[column];
    const camel = snakeToCamel(column);
    if (Object.prototype.hasOwnProperty.call(r, camel)) return r[camel];
    const snake = camelToSnake(column);
    if (Object.prototype.hasOwnProperty.call(r, snake)) return r[snake];
    const values = Object.values(r);
    return values.length === 1 ? values[0] : undefined;
  });
}

function selectListIncludes(sql: string, column: string): boolean {
  const matched = sql.match(/\bselect\s+([\s\S]+?)\s+from\b/i);
  if (!matched) return false;
  const raw = matched[1].trim();
  if (raw === "*" || /(^|,)\s*\*/.test(raw)) return true;
  const wanted = new Set([
    column.toLowerCase(),
    snakeToCamel(column).toLowerCase(),
    camelToSnake(column).toLowerCase(),
  ]);
  return raw.split(",").some((part) => {
    const piece = part.trim().split(/\s+/).pop() ?? "";
    const name = piece.replace(/[`"]/g, "").split(".").pop()!.toLowerCase();
    return wanted.has(name);
  });
}

interface BatchPlan {
  column: string;
  param: string;
  template: string;
}

/**
 * 仅当 SQL 是单条 SELECT、恰好一处 `列 = #{参数}`、且结果里带该列时，
 * 才能改写成 IN 后按父键分组。子查询 / LIMIT 会改变语义，不合并。
 */
function tryBatchPlan(sql: string): BatchPlan | null {
  const template = sql.trim();
  if (template.includes("${")) return null;
  if ((template.match(/\bselect\b/gi) || []).length !== 1) return null;
  if (/\blimit\b/i.test(template)) return null;

  const hashes = [...template.matchAll(/#\{([^}]+)\}/g)];
  if (hashes.length !== 1) return null;
  const param = hashes[0][1].split(",")[0].trim();
  if (!/^[A-Za-z_][\w]*$/.test(param)) return null;

  const eq = new RegExp(
    `(?:[A-Za-z_][\\w]*\\.)?([A-Za-z_][\\w]*)\\s*=\\s*#\\{\\s*${param}\\s*(?:,[^}]*)?\\}`,
    "i"
  );
  const found = eq.exec(template);
  if (!found) return null;
  const column = found[1];
  if (!selectListIncludes(template, column)) return null;
  const ident = found[0].split("=")[0].trim();

  return {
    column,
    param,
    template: template.replace(eq, `${ident} IN (__IN__)`),
  };
}

function readFk(row: Record<string, unknown>, column: string): unknown {
  if (Object.prototype.hasOwnProperty.call(row, column)) return row[column];
  const camel = snakeToCamel(column);
  if (Object.prototype.hasOwnProperty.call(row, camel)) return row[camel];
  const snake = camelToSnake(column);
  if (Object.prototype.hasOwnProperty.call(row, snake)) return row[snake];
  return undefined;
}

function childObjects(mapped: unknown): Record<string, unknown>[] {
  const list = Array.isArray(mapped)
    ? mapped
    : mapped && typeof mapped === "object"
      ? [mapped]
      : [];
  return list.filter(
    (row): row is Record<string, unknown> =>
      !!row && typeof row === "object" && !Array.isArray(row)
  );
}

async function queryIn(
  template: string,
  ids: unknown[]
): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  const size = 500;
  for (let i = 0; i < ids.length; i += size) {
    const chunk = ids.slice(i, i + size);
    const sql = template.replace("__IN__", chunk.map(() => "?").join(", "));
    const result = (await Db.query(sql, chunk)) as RowDataPacket[];
    all.push(...(result as unknown as Record<string, unknown>[]));
  }
  return all;
}

function mapSelectResult(
  rows: Record<string, unknown>[],
  meta: FieldSelectMeta
): unknown {
  if (meta.column) {
    const values = pickColumn(rows, meta.column);
    return meta.many ? values : (values[0] ?? null);
  }
  if (meta.many) return rows;
  return rows[0] ?? null;
}

function filterMetas(
  metas: FieldSelectMeta[],
  options?: HydrateFieldSelectOptions
): FieldSelectMeta[] {
  let list = metas;
  if (!options?.includeLazy) {
    list = list.filter((m) => m.eager);
  }
  if (options?.properties?.length) {
    const allow = new Set(options.properties);
    list = list.filter((m) => allow.has(m.property));
  }
  return list;
}

async function hydrateOne(
  row: Record<string, unknown>,
  entity: Function,
  metas: FieldSelectMeta[],
  remainingDepth: number,
  options?: HydrateFieldSelectOptions
): Promise<void> {
  if (!metas.length) return;
  const ctx = buildRowParamContext(row, entity);

  await Promise.all(
    metas.map(async (meta) => {
      try {
        const parsed = parseMybatisSql(meta.sql, ctx);
        const result = (await Db.query(
          parsed.sql,
          parsed.params
        )) as RowDataPacket[];
        const rows = result as unknown as Record<string, unknown>[];
        const mapped = mapSelectResult(rows, meta);
        row[meta.property] = mapped;

        const childDepth = Math.min(meta.depth, remainingDepth);
        if (childDepth > 0 && mapped) {
          const childRows = Array.isArray(mapped)
            ? mapped
            : typeof mapped === "object"
              ? [mapped as Record<string, unknown>]
              : [];
          const objectRows = childRows.filter(
            (r): r is Record<string, unknown> =>
              !!r && typeof r === "object" && !Array.isArray(r)
          );
          if (objectRows.length) {
            await hydrateFieldSelects(entity, objectRows, {
              ...options,
              maxDepth: childDepth - 1,
              includeLazy: true,
            });
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(
          `[FieldSelect] ${entity.name || "Entity"}.${meta.property} 填充失败: ${msg}`
        );
      }
    })
  );
}

async function hydrateBatch<T extends Record<string, any>>(
  rows: T[],
  entity: Function,
  meta: FieldSelectMeta,
  plan: BatchPlan,
  remainingDepth: number,
  options?: HydrateFieldSelectOptions
): Promise<void> {
  const keyOf = (value: unknown) =>
    value === undefined || value === null ? undefined : String(value);

  const ids: unknown[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const id = readFk(row as Record<string, unknown>, plan.param);
    const key = keyOf(id);
    if (key === undefined || seen.has(key)) continue;
    seen.add(key);
    ids.push(id);
  }

  const groups = new Map<string, Record<string, unknown>[]>();
  if (ids.length) {
    let queried: Record<string, unknown>[];
    try {
      queried = await queryIn(plan.template, ids);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `[FieldSelect] ${entity.name || "Entity"}.${meta.property} 批量填充失败: ${msg}`
      );
    }
    for (const child of queried) {
      const key = keyOf(readFk(child, plan.column));
      if (key === undefined) continue;
      const bucket = groups.get(key);
      if (bucket) bucket.push(child);
      else groups.set(key, [child]);
    }
  }

  const nested: Record<string, unknown>[] = [];
  const childDepth = Math.min(meta.depth, remainingDepth);
  for (const row of rows) {
    const key = keyOf(readFk(row as Record<string, unknown>, plan.param));
    const matched = key === undefined ? [] : (groups.get(key) ?? []);
    const mapped = mapSelectResult(matched, meta);
    (row as Record<string, unknown>)[meta.property] = mapped;
    if (childDepth > 0) nested.push(...childObjects(mapped));
  }

  if (nested.length) {
    await hydrateFieldSelects(entity, nested, {
      ...options,
      maxDepth: childDepth - 1,
      includeLazy: true,
    });
  }
}

/**
 * 按实体上的字段 @Select 填充关联结果（原地修改 rows）。
 * `列 = #{父字段}` 且无子查询 / LIMIT 时合并成一条 IN，避免列表 N+1。
 *
 * @example
 * await hydrateFieldSelects(MenuEntity, rows);
 * await hydrateFieldSelects(MenuEntity, rows, { includeLazy: true, properties: ['children'] });
 */
export async function hydrateFieldSelects<T extends Record<string, any>>(
  entity: Function | undefined,
  rows: T[],
  options: HydrateFieldSelectOptions | number = {}
): Promise<T[]> {
  if (!entity || !rows?.length) return rows;

  const opts: HydrateFieldSelectOptions =
    typeof options === "number" ? { maxDepth: options } : options ?? {};
  const maxDepth = opts.maxDepth ?? 32;
  const metas = filterMetas(getFieldSelects(entity), opts);
  if (!metas.length) return rows;

  const batchJobs: Array<{ meta: FieldSelectMeta; plan: BatchPlan }> = [];
  const rowWise: FieldSelectMeta[] = [];
  for (const meta of metas) {
    const plan = tryBatchPlan(meta.sql);
    if (plan) batchJobs.push({ meta, plan });
    else rowWise.push(meta);
  }

  await Promise.all([
    ...batchJobs.map((job) =>
      hydrateBatch(rows, entity, job.meta, job.plan, maxDepth, opts)
    ),
    rowWise.length
      ? Promise.all(
          rows.map((row) =>
            hydrateOne(
              row as Record<string, unknown>,
              entity,
              rowWise,
              maxDepth,
              opts
            )
          )
        )
      : Promise.resolve(),
  ]);
  return rows;
}
