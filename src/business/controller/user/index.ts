import {
  AuthCheckLogin,
  AuthCheckPermission,
  AuthCheckRole,
  AuthIgnore,
  BusinessType,
  Controller,
  GetMapping,
  Log,
  PostMapping,
  RateLimiter,
  RateLimiterType,
  RepeatSubmit,
  RequestBody,
  RequestPath,
  RequestQuery,
  Validate,
} from "@/framework/Application";
import { Resource } from "@/framework/Service";
import UserService, {
  CreateUserDTO,
  type BindUserRoleDTO,
  type LoginDTO,
  type UpdatePasswordDTO,
  type UpdateProfileDTO,
  type UserPageForm,
} from "@/business/service/user";
import type { PageRequest } from "@/framework/utils/entity/PageResult";

@Controller("/api/user")
export default class UserController {
  @Resource(UserService)
  userService!: UserService;

  @PostMapping("/login")
  @AuthIgnore()
  @Log({ title: "系统登录", business: BusinessType.LOGIN })
  login(@RequestBody() body: LoginDTO) {
    return this.userService.login(body);
  }

  @PostMapping("/logout")
  @AuthIgnore()
  @Log({ title: "退出登录", business: BusinessType.OTHER })
  logout() {
    return this.userService.logout();
  }

  @GetMapping("/check_login")
  @AuthIgnore()
  checkLogin(@RequestQuery() query: { platform?: string }) {
    return this.userService.checkLogin(query?.platform);
  }

  @GetMapping("/profile")
  @AuthCheckLogin()
  getProfile() {
    return this.userService.getProfile();
  }

  @PostMapping("/profile/update")
  @AuthCheckLogin()
  @RepeatSubmit()
  @Log({ title: "修改账户信息", business: BusinessType.UPDATE })
  updateProfile(@RequestBody() body: UpdateProfileDTO) {
    return this.userService.updateProfile(body);
  }

  @PostMapping("/profile/password")
  @AuthCheckLogin()
  @RepeatSubmit()
  @Log({ title: "修改密码", business: BusinessType.UPDATE })
  updatePassword(@RequestBody() body: UpdatePasswordDTO) {
    return this.userService.updatePassword(body);
  }

  @PostMapping("/page")
  @AuthCheckLogin()
  @Log({ title: "用户分页", business: BusinessType.LIST })
  page(@RequestBody() body: PageRequest<UserPageForm>) {
    return this.userService.getUserPage(body);
  }

  @PostMapping("/create")
  @Validate()
  @AuthCheckRole(["ROLE_admin"])
  @AuthCheckPermission(["system:user:create"])
  @RepeatSubmit()
  @Log({ title: "创建用户", business: BusinessType.CREATE })
  async create(@RequestBody() body: CreateUserDTO) {
    await this.userService.createUser(body);
    return null;
  }

  @PostMapping("/update")
  @AuthCheckRole(["ROLE_admin"])
  @AuthCheckPermission(["system:user:update"])
  @RepeatSubmit()
  @Log({ title: "修改用户", business: BusinessType.UPDATE })
  async update(@RequestBody() body: Record<string, unknown>) {
    await this.userService.updateUser(body);
    return null;
  }

  @PostMapping("/get/:id")
  @AuthCheckPermission(["system:user:read"])
  @RateLimiter({ time: 10, count: 3, type: RateLimiterType.IP })
  @Log({ title: "用户详情", business: BusinessType.READ })
  get(@RequestPath() id: string) {
    return this.userService.getUser(id);
  }

  @GetMapping("/get_role/:id")
  @AuthCheckLogin()
  getRole(@RequestPath() id: string) {
    return this.userService.getUserRole(id);
  }

  @PostMapping("/bind_role")
  @AuthCheckRole(["ROLE_admin"])
  @Log({ title: "用户绑定角色", business: BusinessType.UPDATE })
  async bindRole(@RequestBody() body: BindUserRoleDTO) {
    await this.userService.bindUserRole(body);
    return null;
  }

  @PostMapping("/delete/:id")
  @AuthCheckRole(["ROLE_admin"])
  @AuthCheckPermission(["system:user:delete"])
  @Log({ title: "删除用户", business: BusinessType.DELETE })
  async delete(@RequestPath() id: string) {
    await this.userService.deleteUser(id);
    return null;
  }
}
