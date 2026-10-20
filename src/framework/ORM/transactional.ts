import Db from "./Db";
import type { TransactionPropagation } from "./types";

const TX_WRAPPED = Symbol.for("pangza.orm.transactional.wrapped");

type AnyFn = (...args: any[]) => any;

export interface TransactionalOptions {
  /** 事务所属数据源，默认 "default" */
  datasource?: string;
  /**
   * 传播行为（对齐 Spring）：
   * - `REQUIRED`（默认）：加入外层或新建
   * - `REQUIRES_NEW`：挂起外层，独立提交/回滚
   */
  propagation?: TransactionPropagation;
}

function wrapTransactional<T extends AnyFn>(
  fn: T,
  datasource = "default",
  propagation: TransactionPropagation = "REQUIRED"
): T {
  if ((fn as any)[TX_WRAPPED]) return fn;
  const ds = (datasource || "default").trim() || "default";
  const wrapped = async function (this: unknown, ...args: unknown[]) {
    return Db.transactionOn(
      ds,
      async () => fn.apply(this, args),
      { propagation }
    );
  };
  (wrapped as any)[TX_WRAPPED] = true;
  return wrapped as unknown as T;
}

/**
 * 事务装饰器（对齐 Spring @Transactional）。
 * 可标在类或方法上；方法内同数据源的 Db.queryOn / BaseMapper 走同一连接，抛错则回滚。
 *
 * @example
 * @Transactional()
 * async transfer() { ... }
 *
 * @Transactional({ propagation: "REQUIRES_NEW" })
 * async auditLog() { ... }
 *
 * @Transactional({ datasource: "pg" })
 * async syncToPg() { ... }
 */
export function Transactional(
  options?: TransactionalOptions
): MethodDecorator & ClassDecorator {
  const datasource = options?.datasource ?? "default";
  const propagation = options?.propagation ?? "REQUIRED";
  return ((
    target: object | Function,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (propertyKey !== undefined && descriptor && typeof descriptor.value === "function") {
      descriptor.value = wrapTransactional(
        descriptor.value,
        datasource,
        propagation
      );
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
        value: wrapTransactional(desc.value, datasource, propagation),
      });
    }
  }) as MethodDecorator & ClassDecorator;
}
