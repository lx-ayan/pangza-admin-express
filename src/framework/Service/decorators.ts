import "reflect-metadata";
import { inject } from "inversify";
import { table } from "@/framework/ORM";
import type {
  BaseMapper as OrmBaseMapper,
  MapperTableOptions,
} from "@/framework/ORM";
import { getEntityTableMeta } from "@/framework/ORM/entityDecorators";
import { MAPPER_ENTITY_KEY } from "@/framework/ORM/sqlDecorators";
import { registerBeansFromComponent, type BeanToken } from "./bean";
import { Container, type Ctor } from "./container";
import { MAPPER_DELEGATE_METHODS } from "./types";

const MAPPER_BEAN_KEY = Symbol.for("pangza.service.mapperBean");

type EntityCtor = new (...args: any[]) => object;

/**
 * 构造器注入（Inversify `@inject`），Token 为类 / 字符串 / Symbol。
 *
 * @example
 * constructor(@Inject(UserMapper) private mapper: UserMapper) {}
 * constructor(@Inject("uploadPath") private path: string) {}
 */
export const Inject = inject;

/**
 * @Component() / @Component("alias")
 * 按「类」注册到容器；可选字符串别名（仅定时任务等）。
 * 类上的 @Bean 工厂方法返回值也会注册进容器。
 *
 * @example
 * @Component()
 * class FileService {}
 *
 * @Component("sysLogCleanTask")
 * class SysLogCleanTask { execute() {} }
 */
export function Component(alias?: string): ClassDecorator {
  return (ctor) => {
    const Ctor = ctor as unknown as Ctor;
    Container.bindClass(Ctor);
    if (alias?.trim()) {
      Container.bindAlias(alias.trim(), Ctor);
    }
    registerBeansFromComponent(Ctor);
  };
}

/**
 * @Resource(Type | "name" | symbol)
 * 属性懒注入：类单例，或 @Bean 注册的常量。
 *
 * @example
 * @Resource(UserService)
 * private userService!: UserService;
 *
 * @Resource("uploadPath")
 * private uploadPath!: string;
 */
export function Resource(type: BeanToken): PropertyDecorator {
  return (target, propertyKey) => {
    if (
      typeof type !== "function" &&
      typeof type !== "string" &&
      typeof type !== "symbol"
    ) {
      throw new Error(
        `@Resource 请传入类或字符串 Token，属性: ${String(propertyKey)}`
      );
    }

    // 类 Token 交给 Inversify 属性注入；字符串/Symbol 仅用懒 getter
    if (typeof type === "function") {
      const applyInject = inject(type) as PropertyDecorator;
      applyInject(target, propertyKey);
    }

    const key = String(propertyKey);
    Object.defineProperty(target, key, {
      get() {
        const own = Object.prototype.hasOwnProperty.call(this, key)
          ? (this as Record<string, unknown>)[key]
          : undefined;
        if (own !== undefined) return own;
        return Container.get(type as Ctor);
      },
      set(value: unknown) {
        Object.defineProperty(this, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      },
      enumerable: true,
      configurable: true,
    });
  };
}

function resolveMapperBinding(
  tableOrEntity: string | EntityCtor,
  idFieldOrOptions: string | MapperTableOptions = "id"
): { tableName: string; options: string | MapperTableOptions } {
  if (typeof tableOrEntity === "string") {
    return { tableName: tableOrEntity, options: idFieldOrOptions };
  }

  const meta = getEntityTableMeta(tableOrEntity);
  if (!meta?.tableName) {
    throw new Error(
      `[Mapper] 实体 ${tableOrEntity.name} 缺少 @TableName`
    );
  }

  const base: MapperTableOptions =
    typeof idFieldOrOptions === "string"
      ? { idField: idFieldOrOptions }
      : { ...(idFieldOrOptions ?? {}) };

  return {
    tableName: meta.tableName,
    options: {
      idField: base.idField ?? meta.idColumn,
      ...base,
      entity: tableOrEntity,
    },
  };
}

/**
 * @Mapper(table | Entity, idField | options?)
 * 混入 BaseMapper CRUD，并按「类」绑定到容器。
 *
 * @example
 * @Mapper(UserEntity, { logicDelete: true })
 * class UserMapper {}
 */
export function Mapper(
  tableOrEntity: string | EntityCtor,
  idFieldOrOptions: string | MapperTableOptions = "id"
): ClassDecorator {
  return (ctor) => {
    const Ctor = ctor as unknown as Ctor;
    const { tableName, options } = resolveMapperBinding(
      tableOrEntity,
      idFieldOrOptions
    );

    if (typeof tableOrEntity !== "string") {
      Reflect.defineMetadata(MAPPER_ENTITY_KEY, tableOrEntity, ctor);
    }

    for (const method of MAPPER_DELEGATE_METHODS) {
      (Ctor as any).prototype[method] = function (...args: unknown[]) {
        const mapper = table(tableName, options) as OrmBaseMapper;
        const fn = (mapper as any)[method];
        if (typeof fn !== "function") {
          throw new Error(`[Mapper] 缺少方法: ${method}`);
        }
        return fn.apply(mapper, args);
      };
    }

    Container.bindClass(Ctor);
  };
}

/**
 * @Service(MapperClass)
 * 委托 Mapper 方法，并按「类」绑定到容器。
 *
 * @example
 * @Service(UserMapper)
 * class UserService {
 *   @Resource(UserRoleMapper)
 *   private userRoleMapper!: UserRoleMapper;
 * }
 */
export function Service(MapperClass: Ctor): ClassDecorator {
  return (ctor) => {
    const Ctor = ctor as unknown as Ctor;
    (Ctor as any)[MAPPER_BEAN_KEY] = MapperClass;

    for (const method of MAPPER_DELEGATE_METHODS) {
      (Ctor as any).prototype[method] = function (...args: unknown[]) {
        const mapper = resolveMapper(this, MapperClass);
        const fn = (mapper as any)[method];
        if (typeof fn !== "function") {
          throw new Error(`[Service] Mapper 缺少方法: ${method}`);
        }
        return fn.apply(mapper, args);
      };
    }

    for (const key of Object.getOwnPropertyNames(MapperClass.prototype)) {
      if (key === "constructor") continue;
      if ((MAPPER_DELEGATE_METHODS as readonly string[]).includes(key)) {
        continue;
      }
      const desc = Object.getOwnPropertyDescriptor(MapperClass.prototype, key);
      if (!desc || typeof desc.value !== "function") continue;
      (Ctor as any).prototype[key] = function (...args: unknown[]) {
        const mapper = resolveMapper(this, MapperClass);
        return (mapper as any)[key](...args);
      };
    }

    Container.bindClass(Ctor);
  };
}

/** Service 内解析关联 Mapper：优先容器按类获取 */
function resolveMapper(serviceInstance: object, MapperClass: Ctor): object {
  const cached = (serviceInstance as any).__mapper;
  if (cached) return cached;

  let mapper: object;
  if (Container.has(MapperClass)) {
    mapper = Container.get(MapperClass);
  } else {
    Container.bindClass(MapperClass);
    mapper = Container.get(MapperClass);
  }
  (serviceInstance as any).__mapper = mapper;
  return mapper;
}
