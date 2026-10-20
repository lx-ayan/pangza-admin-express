import "reflect-metadata";
import { Container, type Ctor } from "./container";

const BEAN_METHODS_KEY = Symbol.for("pangza.ioc.beanMethods");

export type BeanToken = Ctor | string | symbol;

export interface BeanMethodMeta {
  method: string;
  /** 注入 Token；默认用方法名（字符串） */
  token: BeanToken;
  /** 额外字符串别名（可选） */
  name?: string;
}

export interface BeanOptions {
  /**
   * 注入 Token（类 / 字符串 / Symbol）。
   * 不传则使用方法名作为字符串 Token。
   */
  token?: BeanToken;
  /** 额外字符串别名，便于 @Resource("xxx") */
  name?: string;
}

function beanList(ctor: Function): BeanMethodMeta[] {
  return (
    (Reflect.getOwnMetadata(BEAN_METHODS_KEY, ctor) as
      | BeanMethodMeta[]
      | undefined) ?? []
  );
}

/**
 * @Bean() / @Bean(SomeClass) / @Bean("alias") / @Bean({ token, name })
 *
 * 标在 @Component 类的方法上：方法返回值注册进容器，可通过 @Resource / Container.get 获取。
 *
 * @example
 * @Component()
 * class AppBeans {
 *   @Bean(ObjectMapper)
 *   objectMapper() {
 *     return new ObjectMapper();
 *   }
 *
 *   @Bean("uploadPath")
 *   uploadPath() {
 *     return "/data/upload";
 *   }
 * }
 *
 * // 注入
 * @Resource(ObjectMapper) private mapper!: ObjectMapper;
 * @Resource("uploadPath") private path!: string;
 */
export function Bean(
  tokenOrOptions?: BeanToken | BeanOptions
): MethodDecorator {
  return (target, propertyKey, _descriptor) => {
    const method = String(propertyKey);
    let token: BeanToken = method;
    let name: string | undefined;

    if (typeof tokenOrOptions === "string" || typeof tokenOrOptions === "symbol") {
      token = tokenOrOptions;
      if (typeof tokenOrOptions === "string") name = tokenOrOptions;
    } else if (typeof tokenOrOptions === "function") {
      token = tokenOrOptions;
    } else if (tokenOrOptions && typeof tokenOrOptions === "object") {
      if (tokenOrOptions.token != null) token = tokenOrOptions.token;
      if (tokenOrOptions.name?.trim()) name = tokenOrOptions.name.trim();
    }

    const ctor = (target as object).constructor;
    const list = [...beanList(ctor), { method, token, name }];
    Reflect.defineMetadata(BEAN_METHODS_KEY, list, ctor);
  };
}

export function getBeanMethods(ctor: Function): BeanMethodMeta[] {
  return beanList(ctor);
}

/**
 * 实例化 Component 并执行全部 @Bean 工厂方法，注册返回值。
 * 由 @Component 在 bindClass 之后调用。
 */
export function registerBeansFromComponent(Ctor: Ctor): void {
  const methods = getBeanMethods(Ctor);
  if (!methods.length) return;

  const instance = Container.get(Ctor) as Record<string, unknown>;

  for (const meta of methods) {
    const fn = instance[meta.method];
    if (typeof fn !== "function") {
      throw new Error(
        `[Bean] ${Ctor.name}.${meta.method} 不是可调用的工厂方法`
      );
    }
    const produced = (fn as (...a: unknown[]) => unknown).call(instance);
    const bindValue = (value: unknown) => {
      Container.bindConstant(meta.token, value);
      if (meta.name && meta.name !== (meta.token as unknown)) {
        Container.bindConstant(meta.name, value);
      }
      if (
        typeof meta.token !== "string" &&
        meta.method &&
        !Container.has(meta.method)
      ) {
        Container.bindConstant(meta.method, value);
      }
    };

    if (produced != null && typeof (produced as Promise<unknown>).then === "function") {
      void (produced as Promise<unknown>).then(bindValue, (err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Bean] ${Ctor.name}.${meta.method} 注册失败: ${msg}`);
      });
    } else {
      bindValue(produced);
    }
  }
}
