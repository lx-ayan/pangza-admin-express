import {
  AuthCheckLogin,
  AuthCheckPermission,
  BusinessType,
  Controller,
  GetMapping,
  Log,
  PostMapping,
  RateLimiter,
  RepeatSubmit,
  RequestBody,
  RequestPath,
} from "@/framework/Application";
import { Resource } from "@/framework/Service";
import RoleService, {
  type BindMenuDTO,
  type CreateRoleDTO,
  type RolePageForm,
} from "@/business/service/role";
import type { PageRequest } from "@/framework/utils/entity/PageResult";

@Controller("/api/role")
export default class RoleController {
  @Resource(RoleService)
  roleService!: RoleService;

  @PostMapping("/page")
  @AuthCheckPermission(["system:role:page"])
  @RateLimiter({ count: 3 })
  @Log({ title: "角色分页", business: BusinessType.LIST })
  page(@RequestBody() body: PageRequest<RolePageForm>) {
    return this.roleService.getRolePage(body);
  }

  @PostMapping("/create")
  @AuthCheckPermission(["system:role:create"])
  @RepeatSubmit()
  @Log({ title: "创建角色", business: BusinessType.CREATE })
  create(@RequestBody() body: CreateRoleDTO) {
    return this.roleService.createRole(body);
  }

  @PostMapping("/update")
  @AuthCheckPermission(["system:role:update"])
  @RepeatSubmit()
  @Log({ title: "修改角色", business: BusinessType.UPDATE })
  update(@RequestBody() body: Record<string, unknown>) {
    return this.roleService.updateRole(body);
  }

  @PostMapping("/delete/:id")
  @AuthCheckPermission(["system:role:delete"])
  @Log({ title: "删除角色", business: BusinessType.DELETE })
  delete(@RequestPath() id: string) {
    return this.roleService.deleteRole(id);
  }

  @PostMapping("/bind_menu")
  @AuthCheckLogin()
  @Log({ title: "角色绑定菜单", business: BusinessType.UPDATE })
  bindMenu(@RequestBody() body: BindMenuDTO) {
    return this.roleService.bindMenu(body);
  }

  @PostMapping("/get/:id")
  @AuthCheckPermission(["system:role:read"])
  @Log({ title: "角色详情", business: BusinessType.READ })
  get(@RequestPath() id: string) {
    return this.roleService.getRole(id);
  }

  @PostMapping("/get/menu/:id")
  @AuthCheckLogin()
  getMenu(@RequestPath() id: string) {
    return this.roleService.getRoleMenuIds(id);
  }

  @GetMapping("/list")
  @AuthCheckLogin()
  @Log({ title: "获取角色列表", business: BusinessType.LIST })
  list() {
    return this.roleService.getRoleList();
  }
}
