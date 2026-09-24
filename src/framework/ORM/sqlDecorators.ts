import "reflect-metadata";
import Db, { type ResultSetHeader, type RowDataPacket } from "./Db";
import { registerFieldSelect, type FieldSelectOptions } from "./fieldSelect";
import { buildParamContext, parseMybatisSql } from "./sqlTemplate";

const PARAM_NAMES_KEY = Symbol.for("pangza.orm.sqlParamNames");
/** Mapper 类上挂的实体（供方法级 @Select 结果自动填充字段 @Select） */
export const MAPPER_ENTITY_KEY = Symbol.for("pangza.orm.mapperEntity");

type SqlKind = "select" | "insert" | "update" | "delete";

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

/**
 * @Param("id")
 * 为方法参数命名，供 SQL 中 #{id} / ${id} 引用。
 */
export function Param(name: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) return;
    const key = String(name).trim();
    if (!key) {
      throw new Error("@Param 名称不能为空");
    }
    const map = {
      ...getNamedParams(target as object, propertyKey),
      [parameterIndex]: key,
    };
    Reflect.defineMetadata(PARAM_NAMES_KEY, map, target as object, propertyKey);
  };
}

function createSqlMethodDecorator(kind: SqlKind) {
  return (sql: string): MethodDecorator => {
    if (!sql || !String(sql).trim()) {
      throw new Error(`@${kind[0].toUpperCase()}${kind.slice(1)} SQL 不能为空`);
    }
    const template = String(sql);

    return (target, propertyKey, descriptor) => {
      const methodName = String(propertyKey);
      const named = () => getNamedParams(target as object, propertyKey);

      const executor = async function (
        this: unknown,
        ...args: unknown[]
      ): Promise<unknown> {
        const ctx = buildParamContext(args, named());
        const parsed = parseMybatisSql(template, ctx);
        const result = await Db.query(parsed.sql, parsed.params);

        if (kind === "select") {
          // 方法级 @Select 常用于批量查询，不自动填字段 @Select，避免 N+1。
          // 需要时：hydrateFieldSelects(Entity, rows)
          return result as RowDataPacket[];
        }
        const header = result as unknown as ResultSetHeader;
        if (kind === "insert") {
          return Number(header.insertId ?? 0);
        }
        return Number(header.affectedRows ?? 0);
      };

      if (descriptor) {
        descriptor.value = executor as never;
        return descriptor;
      }
      Object.defineProperty(target, methodName, {
        value: executor,
        writable: true,
        configurable: true,
      });
    };
  };
}

/**
 * @Select — 方法装饰器或字段装饰器。
 *
 * 方法：执行 SQL，返回行数组（Mapper 上若绑定了实体，会自动填充字段级 @Select）。
 * 字段：查询结果映射到该属性（父行字段可用 #{id} / #{parentId} 等引用）。
 *
 * @example
 * // 方法
 * @Select("SELECT * FROM user WHERE id = #{id}")
 * findById(@Param("id") id: string) {}
 *
 * // 字段（collection）
 * @Select("SELECT * FROM menu WHERE parent_id = #{id}", { many: true })
 * children?: Menu[];
 *
 * // 字段（标量）
 * @Select("SELECT name FROM role WHERE id = (SELECT role_id FROM menu_role WHERE menu_id = #{id} LIMIT 1)", { column: "name" })
 * roleName?: string;
 */
export function Select(
  sql: string,
  options?: FieldSelectOptions
): MethodDecorator & PropertyDecorator {
  const template = String(sql ?? "").trim();
  if (!template) {
    throw new Error("@Select SQL 不能为空");
  }

  return ((
    target: object | Function,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    // 方法装饰器：descriptor.value 为函数
    if (
      propertyKey !== undefined &&
      descriptor &&
      typeof descriptor.value === "function"
    ) {
      return createSqlMethodDecorator("select")(template)(
        target,
        propertyKey,
        descriptor
      );
    }

    // 属性装饰器
    if (propertyKey === undefined) {
      throw new Error("@Select 不能用于类");
    }
    const ctor = (target as object).constructor;
    registerFieldSelect(ctor, String(propertyKey), template, options);
  }) as MethodDecorator & PropertyDecorator;
}

/**
 * @Insert("INSERT INTO user(name) VALUES(#{name})")
 * 返回 insertId。
 */
export const Insert = createSqlMethodDecorator("insert");

/**
 * @Update("UPDATE user SET name = #{name} WHERE id = #{id}")
 * 返回 affectedRows。
 */
export const Update = createSqlMethodDecorator("update");

/**
 * @Delete("DELETE FROM user WHERE id = #{id}")
 * 返回 affectedRows（物理删除；逻辑删除请用 BaseMapper.delete*）。
 */
export const Delete = createSqlMethodDecorator("delete");
