import "reflect-metadata";
import { addBeanKey } from "@/framework/Json/beanKeys";
import { camelToSnake } from "@/framework/utils/case";
import { QueryWrapper } from "./QueryWrapper";
import type { PageQuery } from "./types";

/** 对齐 Java OperTypeEnum */
export const OperTypeEnum = {
  EQ: "EQ",
  LIKE: "LIKE",
  LIKE_LEFT: "LIKE_LEFT",
  LIKE_RIGHT: "LIKE_RIGHT",
  GT: "GT",
  GE: "GE",
  LT: "LT",
  LE: "LE",
  NE: "NE",
} as const;

export type OperType = (typeof OperTypeEnum)[keyof typeof OperTypeEnum];

export interface TableSearchOptions {
  /** 数据库列名；空则用字段名 camel → snake（nickName → nick_name） */
  column?: string;
  /** 默认 EQ */
  operator?: OperType;
}

export interface TableSearchMeta {
  property: string;
  column: string;
  operator: OperType;
}

/** 对齐 Java QueryWrapperAndPage */
export interface QueryWrapperAndPage {
  queryWrapper: QueryWrapper;
  page: Required<PageQuery>;
}

type FormCtor = Function;
type WrapperConsumer = (wrapper: QueryWrapper) => void;

const TABLE_SEARCH_KEY = Symbol.for("pangza.orm.tableSearch");

type SearchMap = Record<string, { column: string; operator: OperType }>;

function searchMap(ctor: FormCtor): SearchMap {
  return (
    (Reflect.getOwnMetadata(TABLE_SEARCH_KEY, ctor) as SearchMap | undefined) ??
    {}
  );
}

function resolveColumn(property: string, column?: string): string {
  const c = column?.trim();
  if (c) return c;
  return camelToSnake(property);
}

/**
 * 标记分页/列表查询字段（对齐 Java @TableSearch）。
 *
 * @example
 * class UserPageDTO {
 *   @TableSearch({ operator: OperTypeEnum.LIKE })
 *   username?: string;
 *   @TableSearch({ column: "name_zh" })
 *   name?: string;
 * }
 */
export function TableSearch(
  options?: TableSearchOptions | OperType
): PropertyDecorator {
  return (target, propertyKey) => {
    const ctor = (target as object).constructor;
    const prop = String(propertyKey);
    const opts: TableSearchOptions =
      typeof options === "string" ? { operator: options } : options ?? {};
    const map = { ...searchMap(ctor) };
    map[prop] = {
      column: resolveColumn(prop, opts.column),
      operator: opts.operator ?? OperTypeEnum.EQ,
    };
    Reflect.defineMetadata(TABLE_SEARCH_KEY, map, ctor);
    addBeanKey(ctor, prop);
  };
}

function collectSearchMap(ctor: FormCtor): SearchMap {
  const proto = Object.getPrototypeOf(ctor.prototype);
  const parentCtor = proto?.constructor as FormCtor | undefined;
  const parentMap =
    parentCtor && parentCtor !== Object ? collectSearchMap(parentCtor) : {};
  return { ...parentMap, ...searchMap(ctor) };
}

/** 读取类上全部 @TableSearch 元数据（含父类，子类覆盖） */
export function getTableSearchMeta(formClass: FormCtor): TableSearchMeta[] {
  return Object.entries(collectSearchMap(formClass)).map(
    ([property, meta]) => ({
      property,
      column: meta.column,
      operator: meta.operator,
    })
  );
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function applyOperator(
  wrapper: QueryWrapper,
  operator: OperType,
  column: string,
  value: unknown
): void {
  switch (operator) {
    case OperTypeEnum.LIKE:
      wrapper.like(column, String(value));
      break;
    case OperTypeEnum.LIKE_LEFT:
      wrapper.likeLeft(column, String(value));
      break;
    case OperTypeEnum.LIKE_RIGHT:
      wrapper.likeRight(column, String(value));
      break;
    case OperTypeEnum.GT:
      wrapper.gt(column, value);
      break;
    case OperTypeEnum.GE:
      wrapper.ge(column, value);
      break;
    case OperTypeEnum.LT:
      wrapper.lt(column, value);
      break;
    case OperTypeEnum.LE:
      wrapper.le(column, value);
      break;
    case OperTypeEnum.NE:
      wrapper.ne(column, value);
      break;
    case OperTypeEnum.EQ:
    default:
      wrapper.eq(column, value);
      break;
  }
}

function buildFromForm(
  form: unknown,
  formClass: FormCtor,
  wrapper: QueryWrapper
): void {
  if (form == null || typeof form !== "object") return;
  const data = form as Record<string, unknown>;
  for (const meta of getTableSearchMeta(formClass)) {
    const value = data[meta.property];
    if (isEmptyValue(value)) continue;
    applyOperator(wrapper, meta.operator, meta.column, value);
  }
}

/**
 * 根据表单 + DTO 类上的 @TableSearch 构建 QueryWrapper。
 * JSON body 无原型信息，故第二参数必须传类（如 UserPageDTO）。
 */
export function getQueryWrapper(
  form: unknown,
  formClass: FormCtor,
  consumer?: WrapperConsumer
): QueryWrapper {
  const wrapper = new QueryWrapper();
  buildFromForm(form, formClass, wrapper);
  consumer?.(wrapper);
  return wrapper;
}

/**
 * 构建 QueryWrapper + 分页参数。
 *
 * @example
 * getQueryWrapperAndPage(form, UserPageDTO)
 * getQueryWrapperAndPage(form, UserPageDTO, pageNum, pageSize)
 * getQueryWrapperAndPage(form, UserPageDTO, pageNum, pageSize, (w) => w.orderByDesc('create_time'))
 * getQueryWrapperAndPage(form, UserPageDTO, (w) => w.orderByDesc('id'))
 */
export function getQueryWrapperAndPage(
  form: unknown,
  formClass: FormCtor,
  currentOrConsumer?: number | WrapperConsumer,
  size?: number,
  consumer?: WrapperConsumer
): QueryWrapperAndPage {
  let current = 1;
  let pageSize = 10;
  let fn: WrapperConsumer | undefined;

  if (typeof currentOrConsumer === "function") {
    fn = currentOrConsumer;
  } else {
    if (currentOrConsumer != null) {
      const n = Number(currentOrConsumer);
      current = Number.isFinite(n) && n > 0 ? n : 1;
    }
    if (size != null) {
      const n = Number(size);
      pageSize = Number.isFinite(n) && n > 0 ? n : 10;
    }
    fn = consumer;
  }

  return {
    queryWrapper: getQueryWrapper(form, formClass, fn),
    page: { current, size: pageSize },
  };
}
