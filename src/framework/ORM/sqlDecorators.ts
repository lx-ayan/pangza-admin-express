import "reflect-metadata";
import Db, { type RowDataPacket } from "./Db";
import type { DbType } from "./dialect";
import { registerFieldSelect, type FieldSelectOptions } from "./fieldSelect";
import { mapResultRows } from "./resultMap";
import { buildParamContext, parseMybatisSql } from "./sqlTemplate";

const PARAM_NAMES_KEY = Symbol.for("pangza.orm.sqlParamNames");
/** Mapper 类上挂的实体（供方法级 @Select 结果自动填充字段 @Select） */
export const MAPPER_ENTITY_KEY = Symbol.for("pangza.orm.mapperEntity");

type SqlKind = "select" | "insert" | "update" | "delete";

/** 方法级 SQL 装饰器数据源选项 */
export interface SqlExecuteOptions {
  /**
   * 数据源名称（Db.register 的名字），默认 "default"。
   * 与 db 同时存在时以 datasource 为准。
   */
  datasource?: string;
  /**
   * 按已注册数据源的数据库类型查找（mysql / postgresql / sqlserver）。
   * 同类型有多个时须改用 datasource。
   */
  db?: DbType | string;
}

export type SelectOptions = FieldSelectOptions & SqlExecuteOptions;

function resolveDatasource(options?: SqlExecuteOptions): string {
  if (options?.datasource?.trim()) {
    return options.datasource.trim();
  }
  if (options?.db) {
    return Db.findByType(options.db);
  }
  return "default";
}

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
  return (sql: string, options?: SqlExecuteOptions): MethodDecorator => {
    if (!sql || !String(sql).trim()) {
      throw new Error(`@${kind[0].toUpperCase()}${kind.slice(1)} SQL 不能为空`);
    }
    const template = String(sql);
    const datasource = resolveDatasource(options);

    return (target, propertyKey, descriptor) => {
      const methodName = String(propertyKey);
      const named = () => getNamedParams(target as object, propertyKey);

      const executor = async function (
        this: unknown,
        ...args: unknown[]
      ): Promise<unknown> {
        const ctx = buildParamContext(args, named());
        const parsed = parseMybatisSql(template, ctx);
        const result = await Db.queryOn(datasource, parsed.sql, parsed.params);

        if (kind === "select") {
          // 方法级 @Select 常用于批量查询，不自动填字段 @Select，避免 N+1。
          // 需要时：hydrateFieldSelects(Entity, rows, { datasource })
          return mapResultRows(
            (result as RowDataPacket[]) ?? []
          ) as RowDataPacket[];
        }

        const dialect = Db.getDialect(datasource);
        if (kind === "insert") {
          // 自定义 INSERT 若含 RETURNING / OUTPUT，优先取第一行第一列
          if (Array.isArray(result) && result[0] && typeof result[0] === "object") {
            const row = result[0] as Record<string, unknown>;
            const first = Object.values(row)[0];
            if (first != null) return Number(first);
          }
          return dialect.extractInsertId(result, "id", false);
        }
        return dialect.extractAffectedRows(result);
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
 * 方法：执行 SQL，返回行数组。
 * 字段：查询结果映射到该属性（父行字段可用 #{id} / #{parentId} 等引用）。
 *
 * @example
 * @Select("SELECT * FROM user WHERE id = #{id}")
 * findById(@Param("id") id: string) {}
 *
 * @Select('SELECT * FROM "user" WHERE id = #{id}', { db: "postgresql" })
 * findOnPg(@Param("id") id: string) {}
 *
 * @Select("SELECT * FROM menu WHERE parent_id = #{id}", { many: true })
 * children?: Menu[];
 */
export function Select(
  sql: string,
  options?: SelectOptions
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
      return createSqlMethodDecorator("select")(template, options)(
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
 * 返回 insertId；PostgreSQL / SQL Server 建议在 SQL 中写 RETURNING / OUTPUT。
 *
 * @example
 * @Insert("INSERT INTO user(name) VALUES(#{name})", { datasource: "pg" })
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
