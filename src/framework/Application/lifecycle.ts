import { Container } from "@/framework/Service";
import { getLogger } from "@/framework/Logger";
import type { ApplicationDestroy, ApplicationInit } from "./types";

const log = getLogger("Lifecycle");

let initsDone = false;
let destroysDone = false;
let processHooked = false;
/** 已收集的 Destroy 实例（与 Init 同序收集，销毁时逆序） */
const destroyBeans: ApplicationDestroy[] = [];

export function isApplicationInit(bean: unknown): bean is ApplicationInit {
  return (
    !!bean &&
    typeof bean === "object" &&
    typeof (bean as ApplicationInit).init === "function"
  );
}

export function isApplicationDestroy(
  bean: unknown
): bean is ApplicationDestroy {
  return (
    !!bean &&
    typeof bean === "object" &&
    typeof (bean as ApplicationDestroy).destroy === "function"
  );
}

/**
 * 启动成功后：扫描容器单例，调用实现了 ApplicationInit 的 init()。
 * 同时收集 ApplicationDestroy，供进程退出时调用。
 */
export async function runApplicationInits(): Promise<void> {
  if (initsDone) return;
  initsDone = true;

  destroyBeans.length = 0;
  const ctors = Container.getBoundClasses();
  for (const ctor of ctors) {
    let bean: unknown;
    try {
      bean = Container.get(ctor);
    } catch (err) {
      log.warn(
        { err, name: ctor.name },
        "获取 Bean 失败，跳过生命周期"
      );
      continue;
    }

    if (isApplicationDestroy(bean)) {
      destroyBeans.push(bean);
    }

    if (!isApplicationInit(bean)) continue;
    try {
      await bean.init();
      log.info(`${ctor.name}.init() 完成`);
    } catch (err) {
      // 单个 Bean 失败不中断其它 Init，也不拖垮进程
      log.error({ err, name: ctor.name }, "ApplicationInit 执行失败");
    }
  }
}

/**
 * 进程结束前：逆序调用 ApplicationDestroy.destroy()。
 */
export async function runApplicationDestroys(): Promise<void> {
  if (destroysDone) return;
  destroysDone = true;

  for (const bean of [...destroyBeans].reverse()) {
    const name = (bean as { constructor?: { name?: string } }).constructor
      ?.name;
    try {
      await bean.destroy();
      log.info(`${name ?? "Bean"}.destroy() 完成`);
    } catch (err) {
      log.error({ err, name }, "ApplicationDestroy 执行失败");
    }
  }
  destroyBeans.length = 0;
}

/** 注册 SIGINT / SIGTERM → ApplicationDestroy（只挂一次） */
export function hookProcessDestroy(): void {
  if (processHooked) return;
  processHooked = true;

  const shutdown = (signal: string) => {
    void (async () => {
      log.info(`收到 ${signal}，执行 ApplicationDestroy…`);
      try {
        await runApplicationDestroys();
      } finally {
        process.exit(0);
      }
    })();
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

/** 测试用重置 */
export function resetLifecycleForTest(): void {
  initsDone = false;
  destroysDone = false;
  processHooked = false;
  destroyBeans.length = 0;
}
