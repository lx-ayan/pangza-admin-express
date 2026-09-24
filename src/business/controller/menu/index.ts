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
import MenuService, {
  type BindRoleDTO,
  type CreateMenuDTO,
  type MenuPageForm,
} from "@/business/service/menu";
import type { PageRequest } from "@/framework/utils/entity/PageResult";

@Controller("/api/menu")
export default class MenuController {
  @Resource(MenuService)
  menuService!: MenuService;

  @GetMapping("/router")
  @AuthCheckLogin()
  router() {
    return this.menuService.getUserRouter();
  }

  @GetMapping("/menu_with_children")
  @AuthCheckLogin()
  menuWithChildren() {
    return this.menuService.getMenuWithChildren();
  }

  @PostMapping("/page")
  @AuthCheckPermission(["system:menu:page"])
  @RateLimiter({ count: 3, time: 5 })
  @Log({ title: "获取分页菜单", business: BusinessType.LIST })
  page(@RequestBody() body: PageRequest<MenuPageForm>) {
    return this.menuService.getMenuPage(body);
  }

  @PostMapping("/create")
  @AuthCheckPermission(["system:menu:create"])
  @RepeatSubmit()
  @Log({ title: "创建菜单", business: BusinessType.CREATE })
  create(@RequestBody() body: CreateMenuDTO) {
    return this.menuService.saveMenu(body);
  }

  @PostMapping("/update")
  @AuthCheckPermission(["system:menu:update"])
  @RepeatSubmit()
  @Log({ title: "修改菜单", business: BusinessType.UPDATE })
  update(@RequestBody() body: Record<string, unknown>) {
    return this.menuService.updateMenu(body);
  }

  @PostMapping("/delete/:id")
  @AuthCheckPermission(["system:menu:delete"])
  @Log({ title: "删除菜单", business: BusinessType.DELETE })
  delete(@RequestPath() id: string) {
    return this.menuService.deleteMenu(id);
  }

  @GetMapping("/get/role/:id")
  @AuthCheckLogin()
  getRole(@RequestPath() id: string) {
    return this.menuService.getMenuRoleIds(id);
  }

  @PostMapping("/bind_role")
  @AuthCheckLogin()
  @RepeatSubmit()
  @Log({ title: "菜单绑定权限", business: BusinessType.UPDATE })
  bindRole(@RequestBody() body: BindRoleDTO) {
    return this.menuService.bindRole(body);
  }

  @GetMapping("/:id")
  @AuthCheckPermission(["system:menu:read"])
  @Log({ title: "菜单详情", business: BusinessType.READ })
  getById(@RequestPath() id: string) {
    return this.menuService.getMenuById(id);
  }
}
