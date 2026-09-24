import Db from "./Db";

const TX_WRAPPED = Symbol.for("pangza.orm.transactional.wrapped");

type AnyFn = (...args: any[]) => any;

function wrapTransactional<T extends AnyFn>(fn: T): T {
  if ((fn as any)[TX_WRAPPED]) return fn;
  const wrapped = async function (this: unknown, ...args: unknown[]) {
    return Db.transaction(async () => fn.apply(this, args));
  };
  (wrapped as any)[TX_WRAPPED] = true;
  return wrapped as unknown as T;
}

/**
 * 事务装饰器（对齐 Spring @Transactional，传播行为 REQUIRED）。
 * 可标在类或方法上；方法内 Db.query / BaseMapper 走同一连接，抛错则回滚。
 * 已处于外层事务时加入外层，不再单独提交。
 *
 * @example
 * @Transactional()
 * async transfer() {
 *   await this.updateById(a);
 *   await this.updateById(b);
 * }
 */
export function Transactional(): MethodDecorator & ClassDecorator {
  return ((
    target: object | Function,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey !== undefined && descriptor && typeof descriptor.value === "function") {
      descriptor.value = wrapTransactional(descriptor.value);
      return descriptor;
    }

    const proto = (target as { prototype?: object }).prototype;
    if (!proto) return;

    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (!desc || typeof desc.value !== "function") continue;
      Object.defineProperty(proto, key, {
        ...desc,
        value: wrapTransactional(desc.value),
      });
    }
  }) as MethodDecorator & ClassDecorator;
}
