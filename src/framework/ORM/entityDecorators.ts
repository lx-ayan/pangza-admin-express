import "reflect-metadata";
import { addBeanKey } from "@/framework/Json/beanKeys";

/** insertFill / updateFill：直接值，或同步/异步函数 */
export type FieldFillValue =
  | unknown
  | (() => unknown)
  | (() => Promise<unknown>);

export interface TableIdOptions {
  /** 数据库列名，默认用属性名 */
  value?: string;
}

export interface TableFieldOptions {
  /** 数据库列名，默认用属性名 */
  value?: string;
  /** false 表示非表字段，不参与默认 SQL 映射 */
  exist?: boolean;
  /**
   * 插入时默认填充：常量或函数。
   * 仅当实体上该列仍为 undefined 时写入。
   */
  insertFill?: FieldFillValue;
  /**
   * 更新时默认填充：常量或函数。
   * 仅当实体上该列仍为 undefined 时写入。
   */
  updateFill?: FieldFillValue;
}

export interface EntityFieldMeta {
  /** 实体属性名 */
  property: string;
  /** 数据库列名 */
  column: string;
  /** 是否主键 */
  id?: boolean;
  exist: boolean;
  insertFill?: FieldFillValue;
  updateFill?: FieldFillValue;
}

export interface EntityTableMeta {
  tableName: string;
  idColumn: string;
  fields: EntityFieldMeta[];
}

const TABLE_NAME_KEY = Symbol.for("pangza.orm.tableName");
const FIELDS_KEY = Symbol.for("pangza.orm.entityFields");

type Ctor = Function;

function fieldMap(ctor: Ctor): Record<string, EntityFieldMeta> {
  return (
    (Reflect.getOwnMetadata(FIELDS_KEY, ctor) as
      | Record<string, EntityFieldMeta>
      | undefined) ?? {}
  );
}

function saveField(ctor: Ctor, meta: EntityFieldMeta): void {
  const map = { ...fieldMap(ctor), [meta.property]: meta };
  Reflect.defineMetadata(FIELDS_KEY, map, ctor);
  addBeanKey(ctor, meta.property);
}

/**
 * @TableName("user")
 * 标记实体对应表名。
 */
export function TableName(tableName: string): ClassDecorator {
  return (ctor) => {
    const name = String(tableName).trim();
    if (!name) throw new Error("@TableName 不能为空");
    Reflect.defineMetadata(TABLE_NAME_KEY, name, ctor);
  };
}

/**
 * @TableId() / @TableId("user_id") / @TableId({ value: "user_id" })
 * 标记主键字段。
 */
export function TableId(
  valueOrOptions?: string | TableIdOptions
): PropertyDecorator {
  return (target, propertyKey) => {
    const property = String(propertyKey);
    let column = property;
    if (typeof valueOrOptions === "string") {
      column = valueOrOptions || property;
    } else if (valueOrOptions?.value) {
      column = valueOrOptions.value;
    }
    const ctor = (target as object).constructor;
    saveField(ctor, {
      property,
      column,
      id: true,
      exist: true,
    });
  };
}

/**
 * @TableField("nick_name")
 * @TableField({ value: "create_time", insertFill: () => new Date() })
 */
export function TableField(
  valueOrOptions?: string | TableFieldOptions
): PropertyDecorator {
  return (target, propertyKey) => {
    const property = String(propertyKey);
    let options: TableFieldOptions = {};
    if (typeof valueOrOptions === "string") {
      options = { value: valueOrOptions };
    } else if (valueOrOptions) {
      options = valueOrOptions;
    }
    const ctor = (target as object).constructor;
    const prev = fieldMap(ctor)[property];
    saveField(ctor, {
      property,
      column: options.value || property,
      id: prev?.id,
      exist: options.exist !== false,
      insertFill: options.insertFill,
      updateFill: options.updateFill,
    });
  };
}

export function getTableName(entity: Ctor): string | undefined {
  return Reflect.getOwnMetadata(TABLE_NAME_KEY, entity) as string | undefined;
}

export function getEntityFields(entity: Ctor): EntityFieldMeta[] {
  return Object.values(fieldMap(entity));
}

export function getEntityTableMeta(entity: Ctor): EntityTableMeta | undefined {
  const tableName = getTableName(entity);
  if (!tableName) return undefined;
  const fields = getEntityFields(entity);
  const idField = fields.find((f) => f.id);
  return {
    tableName,
    idColumn: idField?.column ?? "id",
    fields,
  };
}

export async function resolveFieldFill(
  fill: FieldFillValue | undefined
): Promise<unknown> {
  if (fill === undefined) return undefined;
  if (typeof fill === "function") {
    return await (fill as () => unknown | Promise<unknown>)();
  }
  return fill;
}

/**
 * 按实体 @TableField 的 insertFill / updateFill 填充。
 * 写入列名（column）；属性名与列名不同时同步写属性名，便于对象读写。
 * 仅当目标键仍为 undefined 时填充。
 */
export async function applyEntityFieldFills(
  entityClass: Ctor | undefined,
  row: Record<string, any>,
  mode: "insert" | "update"
): Promise<void> {
  if (!entityClass) return;
  const fields = getEntityFields(entityClass);
  for (const field of fields) {
    if (!field.exist) continue;
    const fill =
      mode === "insert" ? field.insertFill : field.updateFill;
    if (fill === undefined) continue;

    const colKey = field.column;
    const propKey = field.property;
    const current =
      row[colKey] !== undefined ? row[colKey] : row[propKey];
    if (current !== undefined) continue;

    const value = await resolveFieldFill(fill);
    if (value === undefined || value === null) continue;
    // 只写列名，避免 camelCase 属性名被当成 SQL 列
    row[colKey] = value;
  }
}
