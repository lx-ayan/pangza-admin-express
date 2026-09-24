import {
  AuthCheckPermission,
  AuthCheckRole,
  BusinessType,
  Controller,
  Log,
  PostMapping,
  RepeatSubmit,
  RequestBody,
  RequestPath,
} from "@/framework/Application";
import { Resource } from "@/framework/Service";
import SysScheduleService, {
  type CreateScheduleDTO,
  type SchedulePageForm,
  type UpdateScheduleDTO,
} from "@/business/service/sysSchedule";
import type { PageRequest } from "@/framework/utils/entity/PageResult";

@Controller("/api/schedule")
export default class ScheduleController {
  @Resource(SysScheduleService)
  sysScheduleService!: SysScheduleService;

  @PostMapping("/page")
  @AuthCheckRole(["ROLE_admin"])
  @AuthCheckPermission(["system:schedule"])
  @Log({ title: "定时任务分页", business: BusinessType.LIST })
  page(@RequestBody() body: PageRequest<SchedulePageForm>) {
    return this.sysScheduleService.getSchedulePage(body);
  }

  @PostMapping("/get/:id")
  @AuthCheckRole(["ROLE_admin"])
  @AuthCheckPermission(["system:schedule"])
  @Log({ title: "定时任务详情", business: BusinessType.OTHER })
  get(@RequestPath() id: string) {
    return this.sysScheduleService.getSchedule(id);
  }

  @PostMapping("/create")
  @AuthCheckRole(["ROLE_admin"])
  @AuthCheckPermission(["system:schedule"])
  @RepeatSubmit()
  @Log({ title: "创建定时任务", business: BusinessType.CREATE })
  async create(@RequestBody() body: CreateScheduleDTO) {
    await this.sysScheduleService.createSchedule(body);
    return null;
  }

  @PostMapping("/update")
  @AuthCheckRole(["ROLE_admin"])
  @AuthCheckPermission(["system:schedule"])
  @RepeatSubmit()
  @Log({ title: "修改定时任务", business: BusinessType.UPDATE })
  async update(@RequestBody() body: UpdateScheduleDTO) {
    await this.sysScheduleService.updateSchedule(body);
    return null;
  }

  @PostMapping("/delete/:id")
  @AuthCheckRole(["ROLE_admin"])
  @AuthCheckPermission(["system:schedule"])
  @Log({ title: "删除定时任务", business: BusinessType.DELETE })
  async delete(@RequestPath() id: string) {
    await this.sysScheduleService.deleteSchedule(id);
    return null;
  }

  @PostMapping("/run/:id")
  @AuthCheckRole(["ROLE_admin"])
  @AuthCheckPermission(["system:schedule"])
  @Log({ title: "立即执行定时任务", business: BusinessType.OTHER })
  async run(@RequestPath() id: string) {
    await this.sysScheduleService.runSchedule(id);
    return null;
  }

  @PostMapping("/status/:id")
  @AuthCheckRole(["ROLE_admin"])
  @AuthCheckPermission(["system:schedule"])
  @Log({ title: "修改定时任务状态", business: BusinessType.UPDATE })
  async changeStatus(
    @RequestPath() id: string,
    @RequestBody() body: { status?: number }
  ) {
    await this.sysScheduleService.changeStatus(id, body?.status);
    return null;
  }
}
