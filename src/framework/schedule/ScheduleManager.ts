import cron, { type ScheduledTask } from "node-cron";
import { Container } from "@/framework/Service";
import { OrmError, QueryWrapper } from "@/framework/ORM";
import SysScheduleService from "@/business/service/sysSchedule";

export interface ScheduleJobEntity {
  id: string;
  title?: string;
  cron: string;
  beanName: string;
  status?: number | null;
}

/**
 * Quartz 风格 Cron → node-cron：
 * - 将 `?` 替换为 `*`
 * - 6 段（含秒）原样交给 node-cron
 */
export function convertQuartzCron(cronExpr: string): string {
  const raw = String(cronExpr ?? "").trim();
  if (!raw) throw new OrmError("Cron 表达式不能为空");
  const converted = raw.replace(/\?/g, "*");
  const parts = converted.split(/\s+/).filter(Boolean);
  if (parts.length !== 5 && parts.length !== 6) {
    throw new OrmError(`Cron 表达式不合法：${cronExpr}`);
  }
  return parts.join(" ");
}

export function validateCron(cronExpr: string): string {
  const expr = convertQuartzCron(cronExpr);
  if (!cron.validate(expr)) {
    throw new OrmError(`Cron 表达式不合法：${cronExpr}`);
  }
  return expr;
}

function invokeBean(beanName: string): void {
  if (!beanName?.trim()) {
    throw new OrmError("执行类（Bean 名称）不能为空");
  }
  if (!Container.has(beanName)) {
    throw new OrmError(`未找到 Bean：${beanName}`);
  }
  const bean = Container.get<any>(beanName);
  if (typeof bean?.execute === "function") {
    bean.execute();
    return;
  }
  if (typeof bean?.run === "function") {
    bean.run();
    return;
  }
  throw new OrmError(`Bean [${beanName}] 需实现 execute() 或 run()`);
}

/**
 * 定时任务调度管理（node-cron）
 */
class ScheduleManagerImpl {
  private readonly jobs = new Map<string, ScheduledTask>();

  scheduleJob(entity: ScheduleJobEntity): void {
    const id = String(entity.id);
    this.unschedule(id);

    if (entity.status == null || Number(entity.status) === 0) {
      console.log(`[Schedule] 任务已停用，已从调度器移除 id=${id}`);
      return;
    }

    const expr = validateCron(entity.cron);
    const beanName = entity.beanName;
    if (!Container.has(beanName)) {
      throw new OrmError(`未找到 Bean：${beanName}`);
    }

    const task = cron.schedule(expr, () => {
      try {
        console.log(
          `[Schedule] 触发任务 id=${id}, title=${entity.title ?? ""}, bean=${beanName}`
        );
        invokeBean(beanName);
      } catch (e) {
        console.error(
          `[Schedule] 任务执行失败 id=${id}:`,
          e instanceof Error ? e.message : e
        );
      }
    });
    this.jobs.set(id, task);
    console.log(`[Schedule] 已注册任务 id=${id}, cron=${expr}`);
  }

  unschedule(id: string): void {
    const task = this.jobs.get(String(id));
    if (task) {
      task.stop();
      this.jobs.delete(String(id));
    }
  }

  runOnce(beanName: string): void {
    invokeBean(beanName);
  }

  async loadEnabled(): Promise<void> {
    // 确保示例任务 Bean 已注册
    require("../../business/schedule/tasks");

    let service: SysScheduleService;
    try {
      service = Container.get(SysScheduleService);
    } catch {
      console.warn("[Schedule] SysScheduleService 未就绪，跳过初始化");
      return;
    }

    try {
      const list = await service.selectList(
        new QueryWrapper().eq("status", 1)
      );
      for (const row of list as any[]) {
        try {
          this.scheduleJob({
            id: String(row.id),
            title: row.title,
            cron: row.cron,
            beanName: row.bean_name ?? row.beanName,
            status: row.status,
          });
        } catch (e) {
          console.error(
            `[Schedule] 启动加载失败 id=${row.id}:`,
            e instanceof Error ? e.message : e
          );
        }
      }
      console.log(`[Schedule] 初始化完成，已加载 ${list.length} 个启用任务`);
    } catch (e) {
      console.warn(
        "[Schedule] 初始化跳过：",
        e instanceof Error ? e.message : e
      );
    }
  }
}

export const ScheduleManager = new ScheduleManagerImpl();

/** 启动后加载启用中的定时任务 */
export async function initScheduleJobs(): Promise<void> {
  await ScheduleManager.loadEnabled();
}
