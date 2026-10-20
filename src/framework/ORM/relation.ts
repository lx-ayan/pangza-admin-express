import "reflect-metadata";
import { addBeanKey } from "@/framework/Json/beanKeys";
import { getEntityIdField, getTableName } from "./entityDecorators";
import { getFieldSelect, type FieldSelectMeta } from "./fieldSelect";
import { assertIdent } from "./security";
import type { Dialect } from "./dialect";
import { getDialect } from "./dialect";

export type RelationKind = "ManyToOne" | "OneToMany" | "ManyToMany";
export type RelationFetch = "SELECT" | "JOIN";

export interface RelationBaseOptions {
  /** selectList / selectPage 时是否自动填充，默认：ManyToOne true，其余 false */
  eager?: boolean;
  /** 读策略，首期仅 SELECT；JOIN 后续 */
  fetch?: RelationFetch;
  /** 嵌套关联递归层数，默认 0 */
  depth?: number;
  datasource?: string;
  db?: string;
}

export interface ManyToOneOptions extends RelationBaseOptions {
  /** 本表外键列名 */
  foreignKey: string;
  /** 目标表主键列，默认 id */
  targetKey?: string;
}

export interface OneToManyOptions extends RelationBaseOptions {
  /** 对方表指向本表的外键列名 */
  foreignKey: string;
  /** 本表被引用列，默认本表主键 */
  localKey?: string;
}

export interface ManyToManyOptions extends RelationBaseOptions {
  joinTable: string;
  /** 中间表指向本表的列 */
  joinColumn: string;
  /** 中间表指向目标表的列 */
  inverseJoinColumn: string;
  /** 目标表主键列，默认 id */
  targetKey?: string;
  /** 本表被引用列，默认本表主键 */
  localKey?: string;
}

export interface RelationMeta {
  property: string;
  kind: RelationKind;
  /** 延迟解析目标实体，避免循环引用 */
  target: () => Function;
  foreignKey?: string;
  targetKey: string;
  localKey?: string;
  joinTable?: string;
  joinColumn?: string;
  inverseJoinColumn?: string;
  eager: boolean;
  fetch: RelationFetch;
  depth: number;
  many: boolean;
  datasource?: string;
  db?: string;
}

const RELATIONS_KEY = Symbol.for("pangza.orm.relations");

type Ctor = Function;

function relationMap(ctor: Ctor): Record<string, RelationMeta> {
  return (
    (Reflect.getOwnMetadata(RELATIONS_KEY, ctor) as
      | Record<string, RelationMeta>
      | undefined) ?? {}
  );
}

function saveRelation(ctor: Ctor, meta: RelationMeta): void {
  if (getFieldSelect(ctor, meta.property)) {
    throw new Error(
      `@${meta.kind}(${meta.property}) 与字段 @Select 不能同时用于同一属性`
    );
  }
  const prev = relationMap(ctor)[meta.property];
  if (prev) {
    throw new Error(`属性 ${meta.property} 已声明关联 ${prev.kind}`);
  }
  addBeanKey(ctor, meta.property);
  Reflect.defineMetadata(
    RELATIONS_KEY,
    { ...relationMap(ctor), [meta.property]: meta },
    ctor
  );
}

function resolveTargetTable(target: Function): string {
  const name = getTableName(target);
  if (!name) {
    throw new Error(
      `关联目标 ${target.name || "Entity"} 缺少 @TableName`
    );
  }
  return assertIdent(name);
}

function resolveIdColumn(entity: Function, fallback = "id"): string {
  return assertIdent(getEntityIdField(entity)?.column ?? fallback);
}

/** @ManyToOne(() => Role, { foreignKey: "role_id" }) */
export function ManyToOne(
  target: () => Function,
  options: ManyToOneOptions
): PropertyDecorator {
  return (proto, propertyKey) => {
    const property = String(propertyKey);
    const fk = assertIdent(options.foreignKey);
    saveRelation(proto.constructor, {
      property,
      kind: "ManyToOne",
      target,
      foreignKey: fk,
      targetKey: assertIdent(options.targetKey ?? "id"),
      eager: options.eager !== false,
      fetch: options.fetch ?? "SELECT",
      depth: Math.max(0, options.depth ?? 0),
      many: false,
      datasource: options.datasource?.trim() || undefined,
      db: options.db?.trim() || undefined,
    });
  };
}

/** @OneToMany(() => Menu, { foreignKey: "parent_id" }) */
export function OneToMany(
  target: () => Function,
  options: OneToManyOptions
): PropertyDecorator {
  return (proto, propertyKey) => {
    const property = String(propertyKey);
    saveRelation(proto.constructor, {
      property,
      kind: "OneToMany",
      target,
      foreignKey: assertIdent(options.foreignKey),
      targetKey: "id",
      localKey: options.localKey
        ? assertIdent(options.localKey)
        : undefined,
      eager: options.eager === true,
      fetch: options.fetch ?? "SELECT",
      depth: Math.max(0, options.depth ?? 0),
      many: true,
      datasource: options.datasource?.trim() || undefined,
      db: options.db?.trim() || undefined,
    });
  };
}

/** @ManyToMany(() => Role, { joinTable, joinColumn, inverseJoinColumn }) */
export function ManyToMany(
  target: () => Function,
  options: ManyToManyOptions
): PropertyDecorator {
  return (proto, propertyKey) => {
    const property = String(propertyKey);
    saveRelation(proto.constructor, {
      property,
      kind: "ManyToMany",
      target,
      joinTable: assertIdent(options.joinTable),
      joinColumn: assertIdent(options.joinColumn),
      inverseJoinColumn: assertIdent(options.inverseJoinColumn),
      targetKey: assertIdent(options.targetKey ?? "id"),
      localKey: options.localKey
        ? assertIdent(options.localKey)
        : undefined,
      eager: options.eager === true,
      fetch: options.fetch ?? "SELECT",
      depth: Math.max(0, options.depth ?? 0),
      many: true,
      datasource: options.datasource?.trim() || undefined,
      db: options.db?.trim() || undefined,
    });
  };
}

export function getRelations(entity: Ctor): RelationMeta[] {
  return Object.values(relationMap(entity));
}

export function getRelation(
  entity: Ctor,
  property: string
): RelationMeta | undefined {
  return relationMap(entity)[property];
}

/**
 * 把关联元数据编译为 FieldSelect 形态（复用 hydrate 批 IN）。
 * SQL 使用指定方言引号。
 */
export function relationToFieldSelect(
  ownerEntity: Function,
  meta: RelationMeta,
  dialect?: Dialect
): FieldSelectMeta {
  const d = dialect ?? getDialect("mysql");
  const q = (name: string) => d.quoteIdent(assertIdent(name));
  const target = meta.target();
  const targetTable = resolveTargetTable(target);

  let sql: string;
  if (meta.kind === "ManyToOne") {
    const fk = meta.foreignKey!;
    sql = `SELECT * FROM ${q(targetTable)} WHERE ${q(meta.targetKey)} = #{${fk}}`;
  } else if (meta.kind === "OneToMany") {
    const localKey = meta.localKey ?? resolveIdColumn(ownerEntity);
    sql = `SELECT * FROM ${q(targetTable)} WHERE ${q(meta.foreignKey!)} = #{${localKey}}`;
  } else {
    const localKey = meta.localKey ?? resolveIdColumn(ownerEntity);
    const jt = meta.joinTable!;
    const alias = "t";
    const j = "j";
    sql =
      `SELECT ${q(alias)}.* FROM ${q(targetTable)} ${q(alias)} ` +
      `INNER JOIN ${q(jt)} ${q(j)} ON ${q(j)}.${q(meta.inverseJoinColumn!)} = ${q(alias)}.${q(meta.targetKey)} ` +
      `WHERE ${q(j)}.${q(meta.joinColumn!)} = #{${localKey}}`;
  }

  return {
    property: meta.property,
    sql,
    many: meta.many,
    depth: meta.depth,
    eager: meta.eager,
    datasource: meta.datasource,
    db: meta.db,
  };
}
