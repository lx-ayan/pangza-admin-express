import { BaseService, Container, Service } from "@/framework/Service";
import { OrmError, QueryWrapper } from "@/framework/ORM";
import SysScheduleMapper from "@/business/mapper/sysSchedule";
import { rowsToCamel, rowToCamel } from "@/framework/utils/case";
import { nextId } from "@/framework/utils/id";
import {
  toPageResult,
  type PageRequest,
  type PageResult,
} from "@/framework/utils/entity/PageResult";
import {
  ScheduleManager,
  configureSchedule,
  initScheduleJobs,
  validateCron,
} from "@/framework/schedule/ScheduleManager";
import { getLogger } from "@/framework/Logger";
import "@/business/schedule/tasks";

export interface SchedulePageForm {
  title?: string;
  cron?: string;
  status?: number | string;
}

export interface CreateScheduleDTO {
  title: string;
  cron: string;
  beanName: string;
  description?: string;
  status?: number;
}

export interface UpdateScheduleDTO {
  id: string;
  title: string;
  cron: string;
  beanName: string;
  description?: string;
  status?: number;
}

@Service(SysScheduleMapper)
export default class SysScheduleService extends BaseService {
  async getSchedulePage(
    pageRequest: PageRequest<SchedulePageForm>
  ): Promise<PageResult<Record<string, unknown>>> {
    const pageNum = pageRequest?.pageNum ?? 1;
    const pageSize = pageRequest?.pageSize ?? 10;
    const form = pageRequest?.form ?? {};

    const wrapper = new QueryWrapper();
    if (form.title) wrapper.like("title", form.title);
    if (form.cron) wrapper.like("cron", form.cron);
    if (form.status !== undefined && form.status !== null && form.status !== "") {
      wrapper.eq("status", Number(form.status));
    }
    wrapper.orderByDesc("create_time");

    const page = await this.selectPage(
      { current: pageNum, size: pageSize },
      wrapper
    );
    return toPageResult({
      ...page,
      records: rowsToCamel(page.records as any),
    });
  }

  async getSchedule(id: string): Promise<Record<string, unknown>> {
    const row = rowToCamel((await this.selectById(id)) as any);
    if (!row) throw new OrmError("定时任务不存在");
    return row;
  }

  async createSchedule(dto: CreateScheduleDTO): Promise<void> {
    if (!dto?.title?.trim() || !dto?.cron?.trim() || !dto?.beanName?.trim()) {
      throw new OrmError("参数错误");
    }
    this.validateBean(dto.beanName.trim());
    validateCron(dto.cron.trim());

    const status = dto.status == null ? 1 : Number(dto.status);
    const id = nextId();
    const entity = {
      id,
      title: dto.title.trim(),
      cron: dto.cron.trim(),
      beanName: dto.beanName.trim(),
      description: dto.description,
      status,
    };
    await this.insert(entity);
    ScheduleManager.scheduleJob({
      id,
      title: entity.title,
      cron: entity.cron,
      beanName: entity.beanName,
      status,
    });
  }

  async updateSchedule(dto: UpdateScheduleDTO): Promise<void> {
    if (
      !dto?.id ||
      !dto?.title?.trim() ||
      !dto?.cron?.trim() ||
      !dto?.beanName?.trim()
    ) {
      throw new OrmError("参数错误");
    }
    const exists = await this.getSchedule(dto.id);
    this.validateBean(dto.beanName.trim());
    validateCron(dto.cron.trim());

    const status =
      dto.status == null ? Number(exists.status ?? 1) : Number(dto.status);
    await this.updateById({
      id: dto.id,
      title: dto.title.trim(),
      cron: dto.cron.trim(),
      beanName: dto.beanName.trim(),
      description: dto.description,
      status,
    });
    const latest = await this.getSchedule(dto.id);
    ScheduleManager.scheduleJob({
      id: String(latest.id),
      title: String(latest.title ?? ""),
      cron: String(latest.cron ?? ""),
      beanName: String(latest.beanName ?? ""),
      status: Number(latest.status ?? 0),
    });
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.getSchedule(id);
    await this.deleteById(id);
    ScheduleManager.unschedule(id);
  }

  async runSchedule(id: string): Promise<void> {
    const schedule = await this.getSchedule(id);
    const beanName = String(schedule.beanName ?? "");
    this.validateBean(beanName);
    ScheduleManager.runOnce(beanName);
  }

  async changeStatus(id: string, status: number | undefined): Promise<void> {
    if (status == null || (status !== 0 && status !== 1)) {
      throw new OrmError("状态值无效");
    }
    const schedule = await this.getSchedule(id);
    await this.updateById({ id, status });
    ScheduleManager.scheduleJob({
      id,
      title: String(schedule.title ?? ""),
      cron: String(schedule.cron ?? ""),
      beanName: String(schedule.beanName ?? ""),
      status,
    });
  }

  private validateBean(beanName: string): void {
    if (!beanName) {
      throw new OrmError("执行类（Bean 名称）不能为空");
    }
    if (!Container.has(beanName)) {
      throw new OrmError(`未找到 Bean：${beanName}`);
    }
    const bean = Container.get<any>(beanName);
    if (
      typeof bean?.execute !== "function" &&
      typeof bean?.run !== "function"
    ) {
      throw new OrmError(`Bean [${beanName}] 需实现 execute() 或 run()`);
    }
  }
}

const scheduleLog = getLogger("sys-schedule");

/** 示例：启动时从库加载启用中的定时任务 */
configureSchedule({
  loadJobs: async () => {
    const service = Container.get(SysScheduleService);
    const list = await service.selectList(new QueryWrapper().eq("status", 1));
    return (list as any[]).map((row) => ({
      id: String(row.id),
      title: row.title,
      cron: row.cron,
      beanName: row.bean_name ?? row.beanName,
      status: row.status,
    }));
  },
});

// 推迟到扫描完成后再加载，确保任务 Bean 已注册
setImmediate(() => {
  void initScheduleJobs().catch((e) => {
    scheduleLog.error(e, "Schedule 初始化失败");
  });
});
