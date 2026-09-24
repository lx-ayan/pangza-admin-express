import "reflect-metadata";
import { addBeanKey } from "@/framework/Json/beanKeys";

/** 字段级 @Select 选项（对齐 MyBatis association / collection） */
export interface FieldSelectOptions {
  /**
   * true → 结果为数组（collection，如 children）
   * false → 单条/单值（association，如 roleName）
   * 默认 false
   */
  many?: boolean;
  /**
   * 取结果中某一列作为值；
   * many=true 时得到标量数组；many=false 时得到单个标量。
   * 不传则 many 时为行对象数组，否则为第一行对象。
   */
  column?: string;
  /**
   * 对嵌套查出的行是否继续填充其 @Select（同实体递归）。
   * 默认 0：不再递归；设为 1+ 可做有限层树。
   */
  depth?: number;
  /**
   * 是否在 selectList / selectPage 上自动填充。
   * 默认 true。形如 `列 = #{字段}` 的 SQL 会合并成一条 IN；
   * 含子查询或 LIMIT 的仍逐行查。树形全表加载建议 eager:false，再手动 hydrate。
   */
  eager?: boolean;
}

export interface FieldSelectMeta {
  property: string;
  sql: string;
  many: boolean;
  column?: string;
  depth: number;
  eager: boolean;
}

const FIELD_SELECT_KEY = Symbol.for("pangza.orm.fieldSelect");

type Ctor = Function;

function fieldSelectMap(ctor: Ctor): Record<string, FieldSelectMeta> {
  return (
    (Reflect.getOwnMetadata(FIELD_SELECT_KEY, ctor) as
      | Record<string, FieldSelectMeta>
      | undefined) ?? {}
  );
}

/** 注册属性级 @Select */
export function registerFieldSelect(
  ctor: Ctor,
  property: string,
  sql: string,
  options: FieldSelectOptions = {}
): void {
  const template = String(sql).trim();
  if (!template) {
    throw new Error("@Select 字段 SQL 不能为空");
  }
  addBeanKey(ctor, property);
  const map = {
    ...fieldSelectMap(ctor),
    [property]: {
      property,
      sql: template,
      many: options.many === true,
      column: options.column?.trim() || undefined,
      depth: Math.max(0, options.depth ?? 0),
      eager: options.eager !== false,
    },
  };
  Reflect.defineMetadata(FIELD_SELECT_KEY, map, ctor);
}

/** 读取实体上全部字段级 @Select */
export function getFieldSelects(ctor: Ctor): FieldSelectMeta[] {
  return Object.values(fieldSelectMap(ctor));
}

export function getFieldSelect(
  ctor: Ctor,
  property: string
): FieldSelectMeta | undefined {
  return fieldSelectMap(ctor)[property];
}
