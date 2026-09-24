import {
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
import TableConfigService, {
  type CreateTableConfigDTO,
  type TableConfigListForm,
  type TableConfigPageForm,
} from "@/business/service/tableConfig";
import type { PageRequest } from "@/framework/utils/entity/PageResult";

@Controller("/api/table_config")
export default class TableConfigController {
  @Resource(TableConfigService)
  tableConfigService!: TableConfigService;

  @PostMapping("/list")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  @Log({ title: "获取库表配置列表", business: BusinessType.LIST })
  list(@RequestBody() body?: TableConfigListForm) {
    return this.tableConfigService.getTableConfigList(body);
  }

  @PostMapping("/page")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  @Log({ title: "获取库表配置分页", business: BusinessType.LIST })
  page(@RequestBody() body: PageRequest<TableConfigPageForm>) {
    return this.tableConfigService.getTableConfigPage(body);
  }

  @PostMapping("/create")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  @RepeatSubmit()
  @Log({ title: "创建库表配置", business: BusinessType.CREATE })
  async create(@RequestBody() body: CreateTableConfigDTO) {
    await this.tableConfigService.createTableConfig(body);
    return null;
  }

  @PostMapping("/update")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  @RepeatSubmit()
  @Log({ title: "修改库表配置", business: BusinessType.UPDATE })
  async update(@RequestBody() body: Record<string, unknown>) {
    await this.tableConfigService.updateTableConfig(body);
    return null;
  }

  @PostMapping("/delete/:id")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  @Log({ title: "删除库表配置", business: BusinessType.DELETE })
  async delete(@RequestPath() id: string) {
    await this.tableConfigService.deleteTableConfig(id);
    return null;
  }

  @PostMapping("/get/:id")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  get(@RequestPath() id: string) {
    return this.tableConfigService.getTableConfig(id);
  }
}
