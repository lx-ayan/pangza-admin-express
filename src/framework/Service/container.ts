import {
  Container as InversifyContainer,
  decorate,
  injectable,
  type ServiceIdentifier,
} from "inversify";

/** 可 new 的类构造函数（主注入 Token） */
export type Ctor<T = any> = new (...args: any[]) => T;

/**
 * 基于 Inversify 的 IoC 门面。
 *
 * 约定：
 * - **主标识是类**：`Container.get(UserService)` / `@Resource(UserService)`
 * - **字符串别名仅可选**：定时任务等 DB 配置的 beanName（`@Component("sysLogTask")`）
 * - 默认作用域：单例（Singleton）
 */
class AppContainer {
  /** 底层 Inversify 容器（一般业务代码用本门面即可） */
  readonly raw = new InversifyContainer({
    defaultScope: "Singleton",
  });

  /** 确保类带 @injectable；已装饰则忽略 */
  ensureInjectable(ctor: Ctor): void {
    try {
      decorate(injectable(), ctor);
    } catch {
      // Already decorated / cannot decorate again
    }
  }

  /**
   * 按「类」绑定单例。
   * 重复 bind 同一类会跳过（扫描多次 require 安全）。
   */
  bindClass<T>(ctor: Ctor<T>): void {
    this.ensureInjectable(ctor);
    if (this.raw.isBound(ctor)) {
      return;
    }
    this.raw.bind(ctor).toSelf().inSingletonScope();
  }

  /**
   * 字符串别名 → 已绑定的类（同一单例）。
   * 仅用于调度任务 beanName 等必须按名字查找的场景。
   */
  bindAlias<T>(name: string, ctor: Ctor<T>): void {
    const key = name.trim();
    if (!key) {
      throw new Error("[Container] 别名不能为空");
    }
    this.bindClass(ctor);
    if (this.raw.isBound(key)) {
      return;
    }
    this.raw.bind(key).toService(ctor);
  }

  /** 是否已绑定（类或别名） */
  has(id: ServiceIdentifier | Ctor): boolean {
    return this.raw.isBound(id as ServiceIdentifier);
  }

  /** 按类获取单例 */
  get<T>(ctor: Ctor<T>): T;
  /** 按字符串别名获取（定时任务等） */
  get<T = unknown>(id: string | symbol): T;
  get<T>(id: Ctor<T> | string | symbol): T {
    const key = id as ServiceIdentifier;
    if (!this.raw.isBound(key)) {
      const label =
        typeof id === "function" ? id.name || String(id) : String(id);
      throw new Error(`[Container] 未找到组件: ${label}`);
    }
    return this.raw.get(key) as T;
  }

  /** 测试用：清空全部绑定 */
  clear(): void {
    this.raw.unbindAll();
  }
}

/** 进程内唯一容器 */
export const Container = new AppContainer();
