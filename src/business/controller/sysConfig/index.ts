import {
  AuthCheckPermission,
  AuthIgnore,
  BusinessType,
  Controller,
  GetMapping,
  Log,
  PostMapping,
  RepeatSubmit,
  RequestBody,
} from "@/framework/Application";
import { Resource } from "@/framework/Service";
import SysConfigService, {
  type SysConfigPageForm,
  type UpdateSysConfigDTO,
} from "@/business/service/sysConfig";
import type { PageRequest } from "@/framework/utils/entity/PageResult";

@Controller("/api/sys_config")
export default class SysConfigController {
  @Resource(SysConfigService)
  sysConfigService!: SysConfigService;

  /** 登录前可读的公开配置（Vue boot 依赖） */
  @GetMapping("/public")
  @AuthIgnore()
  getPublic() {
    return this.sysConfigService.getPublicConfigMap();
  }

  @PostMapping("/page")
  @AuthCheckPermission(["system:config:page"])
  @Log({ title: "系统配置分页", business: BusinessType.LIST })
  page(@RequestBody() body: PageRequest<SysConfigPageForm>) {
    return this.sysConfigService.getSysConfigPage(body);
  }

  @GetMapping("/list")
  @AuthCheckPermission(["system:config:list"])
  @Log({ title: "系统配置列表", business: BusinessType.LIST })
  list() {
    return this.sysConfigService.getSysConfigList();
  }

  @PostMapping("/update")
  @AuthCheckPermission(["system:config:update"])
  @RepeatSubmit()
  @Log({ title: "修改系统配置", business: BusinessType.UPDATE })
  async update(@RequestBody() body: UpdateSysConfigDTO) {
    await this.sysConfigService.updateSysConfig(body);
    return null;
  }

  @PostMapping("/refresh_cache")
  @AuthCheckPermission(["system:config:update"])
  @Log({ title: "刷新系统配置缓存", business: BusinessType.OTHER })
  async refreshCache() {
    await this.sysConfigService.refreshCache();
    return null;
  }
}
