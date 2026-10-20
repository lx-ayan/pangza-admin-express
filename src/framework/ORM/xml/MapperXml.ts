import "reflect-metadata";
import { executeXmlStatement } from "./execute";
import { ensureXmlMappersLoaded, loadXmlMappers } from "./loadMappers";
import { getXmlStatement } from "./registry";

const PARAM_NAMES_KEY = Symbol.for("pangza.orm.sqlParamNames");
const SQL_BOUND_KEY = Symbol.for("pangza.orm.sqlBound");
const MAPPER_XML_NS_KEY = Symbol.for("pangza.orm.mapperXmlNamespace");
const MAPPER_XML_DS_KEY = Symbol.for("pangza.orm.mapperXmlDatasource");

export interface MapperXmlOptions {
  /** 默认数据源，可被语句 datasource 覆盖 */
  datasource?: string;
}

type Ctor = new (...args: any[]) => any;

function getNamedParams(
  target: object,
  methodName: string | symbol
): Record<number, string> {
  return (
    (Reflect.getOwnMetadata(PARAM_NAMES_KEY, target, methodName) as
      | Record<number, string>
      | undefined) ?? {}
  );
}

function bindMethod(
  proto: object,
  methodName: string,
  namespace: string,
  datasource?: string
): void {
  const desc = Object.getOwnPropertyDescriptor(proto, methodName);
  if (!desc || typeof desc.value !== "function") return;

  if ((desc.value as any)[SQL_BOUND_KEY]) {
    throw new Error(
      `@MapperXml 方法 ${methodName} 已绑定 @Select/@Insert 等注解，不能再绑 XML`
    );
  }

  const named = () => getNamedParams(proto, methodName);
  const wrapped = async function (this: unknown, ...args: unknown[]) {
    ensureXmlMappersLoaded();
    const stmt = getXmlStatement(namespace, methodName);
    if (!stmt) {
      throw new Error(
        `XML 未找到语句 ${namespace}.${methodName}（请检查 mapperLocations 与 id）`
      );
    }
    return executeXmlStatement(namespace, methodName, {
      args,
      namedByIndex: named(),
      datasource,
    });
  };
  (wrapped as any)[SQL_BOUND_KEY] = "xml";

  Object.defineProperty(proto, methodName, {
    ...desc,
    value: wrapped,
  });
}

/**
 * 将类方法绑定到 XML namespace（方法名 = 语句 id）。
 *
 * @example
 * @MapperXml("com.pangza.UserMapper")
 * class UserMapper {
 *   findByRole(@Param("roleId") roleId: number): Promise<any[]> {
 *     throw new Error("bound by XML");
 *   }
 * }
 */
export function MapperXml(
  namespace: string,
  options?: MapperXmlOptions
): ClassDecorator {
  const ns = String(namespace ?? "").trim();
  if (!ns) throw new Error("@MapperXml namespace 不能为空");
  const datasource = options?.datasource?.trim() || undefined;

  return (ctor) => {
    const Ctor = ctor as unknown as Ctor;
    Reflect.defineMetadata(MAPPER_XML_NS_KEY, ns, Ctor);
    if (datasource) {
      Reflect.defineMetadata(MAPPER_XML_DS_KEY, datasource, Ctor);
    }

    const proto = Ctor.prototype as object;
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (!desc || typeof desc.value !== "function") continue;
      bindMethod(proto, key, ns, datasource);
    }
  };
}

export function getMapperXmlNamespace(ctor: Function): string | undefined {
  return Reflect.getOwnMetadata(MAPPER_XML_NS_KEY, ctor) as string | undefined;
}

/** 标记方法已由 @Select 等绑定，供 MapperXml 冲突检测 */
export function markSqlMethodBound(fn: Function, kind = "annotation"): void {
  (fn as any)[SQL_BOUND_KEY] = kind;
}

export function isSqlMethodBound(fn: Function): boolean {
  return !!(fn as any)[SQL_BOUND_KEY];
}

/** 启动时加载 XML（若配置了 mapperLocations） */
export function bootstrapXmlMappers(): void {
  loadXmlMappers();
}
