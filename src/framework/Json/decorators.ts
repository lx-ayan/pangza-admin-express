import "reflect-metadata";
import { addBeanKey } from "./beanKeys";
import type {
  JsonFieldFormatMeta,
  JsonFieldIncludeMeta,
  JsonFormatOptions,
  JsonIncludeOptions,
} from "./types";
import { JsonIncludeType } from "./types";

const JSON_FORMAT_KEY = Symbol.for("pangza.json.formats");
const JSON_INCLUDE_KEY = Symbol.for("pangza.json.include");
const JSON_CLASS_INCLUDE_KEY = Symbol.for("pangza.json.classInclude");

/** 全局字段格式（供 ORM 返回的 plain object 按字段名匹配） */
const globalFieldFormats = new Map<string, JsonFormatOptions>();
/** 全局字段 Include（plain object 按字段名回退） */
const globalFieldIncludes = new Map<string, JsonIncludeOptions>();

type Ctor = Function;

function fieldFormatMap(ctor: Ctor): Record<string, JsonFieldFormatMeta> {
  return (
    (Reflect.getOwnMetadata(JSON_FORMAT_KEY, ctor) as
      | Record<string, JsonFieldFormatMeta>
      | undefined) ?? {}
  );
}

function fieldIncludeMap(ctor: Ctor): Record<string, JsonFieldIncludeMeta> {
  return (
    (Reflect.getOwnMetadata(JSON_INCLUDE_KEY, ctor) as
      | Record<string, JsonFieldIncludeMeta>
      | undefined) ?? {}
  );
}

/**
 * 属性装饰器：自定义该字段序列化给前端的格式。
 *
 * @example
 * @JsonFormat({ pattern: 'yyyy-MM-dd HH:mm:ss' })
 * createTime?: Date;
 */
export function JsonFormat(options: JsonFormatOptions = {}): PropertyDecorator {
  return (target, propertyKey) => {
    const ctor = (target as object).constructor;
    const property = String(propertyKey);
    addBeanKey(ctor, property);
    const map = {
      ...fieldFormatMap(ctor),
      [property]: { property, options },
    };
    Reflect.defineMetadata(JSON_FORMAT_KEY, map, ctor);
    globalFieldFormats.set(property, options);
  };
}

/**
 * 类或属性装饰器：控制空值是否序列化（对齐 Jackson @JsonInclude）。
 *
 * @example
 * @JsonInclude(JsonIncludeType.NON_NULL)
 * class UserVO { ... }
 *
 * @JsonInclude(JsonIncludeType.NON_EMPTY)
 * tags?: string[];
 */
export function JsonInclude(
  valueOrOptions: JsonIncludeType | JsonIncludeOptions = JsonIncludeType.NON_NULL
): ClassDecorator & PropertyDecorator {
  const options: JsonIncludeOptions =
    typeof valueOrOptions === "string"
      ? { value: valueOrOptions }
      : { value: JsonIncludeType.NON_NULL, ...valueOrOptions };

  return ((target: object | Function, propertyKey?: string | symbol) => {
    // 属性装饰器
    if (propertyKey !== undefined) {
      const ctor = (target as object).constructor;
      const property = String(propertyKey);
      addBeanKey(ctor, property);
      const map = {
        ...fieldIncludeMap(ctor),
        [property]: { property, options },
      };
      Reflect.defineMetadata(JSON_INCLUDE_KEY, map, ctor);
      globalFieldIncludes.set(property, options);
      return;
    }
    // 类装饰器
    Reflect.defineMetadata(JSON_CLASS_INCLUDE_KEY, options, target);
  }) as ClassDecorator & PropertyDecorator;
}

/** plain object 序列化时按字段名回退查找 */
export function getGlobalFieldFormat(
  property: string
): JsonFormatOptions | undefined {
  return globalFieldFormats.get(property);
}

export function getGlobalFieldInclude(
  property: string
): JsonIncludeOptions | undefined {
  return globalFieldIncludes.get(property);
}

/** 读取类上所有 @JsonFormat 元数据 */
export function getJsonFieldFormats(ctor: Ctor): JsonFieldFormatMeta[] {
  return Object.values(fieldFormatMap(ctor));
}

/** 读取单个属性的格式配置 */
export function getJsonFieldFormat(
  ctor: Ctor,
  property: string
): JsonFormatOptions | undefined {
  return fieldFormatMap(ctor)[property]?.options;
}

/** 读取类级 @JsonInclude */
export function getClassJsonInclude(
  ctor: Ctor
): JsonIncludeOptions | undefined {
  return Reflect.getOwnMetadata(JSON_CLASS_INCLUDE_KEY, ctor) as
    | JsonIncludeOptions
    | undefined;
}

/** 读取类上字段级 @JsonInclude */
export function getJsonFieldIncludes(ctor: Ctor): JsonFieldIncludeMeta[] {
  return Object.values(fieldIncludeMap(ctor));
}

export function getJsonFieldInclude(
  ctor: Ctor,
  property: string
): JsonIncludeOptions | undefined {
  return fieldIncludeMap(ctor)[property]?.options;
}
