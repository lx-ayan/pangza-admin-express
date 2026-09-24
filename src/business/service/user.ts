import bcrypt from "bcryptjs";
import { BaseService, Resource, Service } from "@/framework/Service";
import { OrmError, QueryWrapper } from "@/framework/ORM";
import { AuthUtil } from "@/framework/Auth";
import { convert } from "@/framework/Json";
import { Email, Max, Min, NotNull, Phone } from "@/framework/Validate";
import UserMapper, { type NameAndPermission } from "@/business/mapper/user";
import UserRoleMapper from "@/business/mapper/userRole";
import { rowToCamel, rowsToCamel, omitPassword } from "@/framework/utils/case";
import { nextId } from "@/framework/utils/id";
import {
  toPageResult,
  type PageRequest,
  type PageResult,
} from "@/framework/utils/entity/PageResult";

export interface LoginDTO {
  username: string;
  password: string;
  platform?: string;
}

export interface LoginVO {
  token: string;
  username: string;
  nickName?: string;
  avatar?: string;
  permission: string[];
}

export interface LoginStatusVO {
  loggedIn: boolean;
  platform?: string;
  username?: string;
  nickName?: string;
  avatar?: string;
  permission?: string[];
}

export interface UpdateProfileDTO {
  nickName?: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar?: string;
}

export interface UpdatePasswordDTO {
  oldPassword: string;
  newPassword: string;
}

/** 创建用户入参（类 + 校验装饰器，配合 @Validate） */
export class CreateUserDTO {
  @NotNull("用户名不能为空")
  @Min(2, "用户名至少 2 个字符")
  @Max(32, "用户名最多 32 个字符")
  username!: string;

  @NotNull("昵称不能为空")
  @Max(32, "昵称最多 32 个字符")
  nickName!: string;

  avatar?: string;

  @Email("邮箱格式不正确")
  email?: string;

  @Phone("手机号格式不正确")
  phone?: string;

  address?: string;
}

export interface BindUserRoleDTO {
  userId: string;
  roleIds: string[];
}

export interface UserPageForm {
  username?: string;
  nickName?: string;
  email?: string;
  phone?: string;
}

function collectRolesAndPermissions(rows: NameAndPermission[]): {
  roles: string[];
  permissions: string[];
  loginPermission: string[];
} {
  const roles: string[] = [];
  const permissions: string[] = [];
  const loginPermission: string[] = [];

  for (const item of rows) {
    const name = item.name?.trim();
    const permission = item.permission?.trim();
    if (name && !roles.includes(name)) roles.push(name);
    if (permission && !permissions.includes(permission)) {
      permissions.push(permission);
    }
    // LoginVO.permission：角色名 + 菜单权限（对齐 Java）
    if (name && !loginPermission.includes(name)) loginPermission.push(name);
    if (permission && !loginPermission.includes(permission)) {
      loginPermission.push(permission);
    }
  }
  return { roles, permissions, loginPermission };
}

@Service(UserMapper)
export default class UserService extends BaseService {
  @Resource(UserRoleMapper)
  userRoleMapper!: UserRoleMapper;

  declare getUserPermission: (userId: string) => Promise<NameAndPermission[]>;

  async login(dto: LoginDTO): Promise<LoginVO> {
    if (!dto?.username?.trim() || !dto?.password?.trim()) {
      throw new OrmError("参数错误");
    }
    const wrapper = new QueryWrapper().eq("username", dto.username.trim());
    const raw = await this.selectOne(wrapper);
    const user = rowToCamel<Record<string, unknown>>(raw as any);
    if (!user) {
      throw new OrmError("用户名或密码输入错误");
    }
    const ok = await bcrypt.compare(
      dto.password,
      String(user.password ?? "")
    );
    if (!ok) {
      throw new OrmError("用户名或密码输入错误");
    }

    const userId = String(user.id);
    const nameAndPerms = await this.getUserPermission(userId);
    const { roles, permissions, loginPermission } =
      collectRolesAndPermissions(nameAndPerms);

    const token = await AuthUtil.login(userId, {
      roles,
      permissions,
      username: String(user.username ?? ""),
      avatar: user.avatar as string | undefined,
      device: dto.platform?.trim() || "web",
    });
    return {
      token,
      username: String(user.username ?? ""),
      nickName: user.nickName as string | undefined,
      avatar: user.avatar as string | undefined,
      permission: loginPermission,
    };
  }

  async logout(): Promise<void> {
    if (!(await AuthUtil.isLogin())) return;
    await AuthUtil.logout();
  }

  async checkLogin(platform?: string): Promise<LoginStatusVO> {
    const status: LoginStatusVO = { loggedIn: false };
    if (!(await AuthUtil.isLogin())) return status;

    const loginId = await AuthUtil.getLoginId();
    const user = omitPassword(
      rowToCamel<Record<string, unknown>>(
        (await this.selectById(loginId)) as any
      )
    );
    if (!user) return status;

    const nameAndPerms = await this.getUserPermission(String(loginId));
    const { loginPermission } = collectRolesAndPermissions(nameAndPerms);

    status.loggedIn = true;
    status.platform = platform || "PC";
    status.username = user.username as string;
    status.nickName = user.nickName as string | undefined;
    status.avatar = user.avatar as string | undefined;
    status.permission = loginPermission;
    return status;
  }

  async getProfile(): Promise<Record<string, unknown>> {
    const loginId = await AuthUtil.getLoginId();
    const user = omitPassword(
      rowToCamel<Record<string, unknown>>(
        (await this.selectById(loginId)) as any
      )
    );
    if (!user) throw new OrmError("用户不存在");
    return user;
  }

  async updateProfile(
    dto: UpdateProfileDTO
  ): Promise<Record<string, unknown>> {
    const loginId = String(await AuthUtil.getLoginId());
    const exist = await this.selectById(loginId);
    if (!exist) throw new OrmError("用户不存在");

    const patch: Record<string, unknown> = { id: loginId };
    if (dto.nickName !== undefined && dto.nickName !== "") {
      patch.nickName = dto.nickName;
    }
    patch.email = dto.email;
    patch.phone = dto.phone;
    patch.address = dto.address;
    if (dto.avatar !== undefined) {
      patch.avatar = dto.avatar;
    }
    await this.updateById(patch);
    return (await this.getProfile())!;
  }

  async updatePassword(dto: UpdatePasswordDTO): Promise<void> {
    if (!dto?.oldPassword || !dto?.newPassword) {
      throw new OrmError("旧密码和新密码不能为空");
    }
    const loginId = await AuthUtil.getLoginId();
    const raw = await this.selectById(loginId);
    const user = rowToCamel<Record<string, unknown>>(raw as any);
    if (!user) throw new OrmError("用户不存在");

    const ok = await bcrypt.compare(
      dto.oldPassword,
      String(user.password ?? "")
    );
    if (!ok) throw new OrmError("旧密码不正确");

    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.updateById({ id: loginId, password: hash });
  }

  async getUserPage(
    pageRequest: PageRequest<UserPageForm>
  ): Promise<PageResult<Record<string, unknown>>> {
    const pageNum = pageRequest?.pageNum ?? 1;
    const pageSize = pageRequest?.pageSize ?? 10;
    const form = pageRequest?.form ?? {};

    const wrapper = new QueryWrapper().select(
      "id",
      "username",
      "nick_name",
      "email",
      "phone",
      "create_time",
      "avatar",
      "address"
    );
    if (form.username) wrapper.like("username", form.username);
    if (form.nickName) wrapper.like("nick_name", form.nickName);
    if (form.email) wrapper.like("email", form.email);
    if (form.phone) wrapper.like("phone", form.phone);
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

  async createUser(dto: CreateUserDTO): Promise<void> {
    // 只保留 CreateUserDTO 声明字段，丢掉多余入参
    const data = convert(dto, CreateUserDTO);
    if (!data?.username?.trim() || !data?.nickName?.trim()) {
      throw new OrmError("参数错误");
    }
    if (await this.hasUser(data.username, null)) {
      throw new OrmError("用户名已存在请勿重复创建");
    }
    const password = await bcrypt.hash("123456", 10);
    await this.insert({
      id: nextId(),
      ...convert(data, [
        "username",
        "nickName",
        "avatar",
        "email",
        "phone",
        "address",
      ]),
      username: data.username.trim(),
      nickName: data.nickName.trim(),
      password,
    });
  }

  async updateUser(user: Record<string, unknown>): Promise<void> {
    const username = String(user.username ?? "").trim();
    const nickName = String(user.nickName ?? "").trim();
    const id = String(user.id ?? "");
    if (!username || !nickName) throw new OrmError("参数错误");
    if (await this.hasUser(username, id)) {
      throw new OrmError("用户名已存在请勿重复创建");
    }
    const { password: _p, ...rest } = user;
    await this.updateById({ ...rest, id, username, nickName });
  }

  async getUser(id: string): Promise<Record<string, unknown> | null> {
    return omitPassword(
      rowToCamel<Record<string, unknown>>((await this.selectById(id)) as any)
    );
  }

  async getUserRole(id: string): Promise<string[]> {
    const list = await this.userRoleMapper.selectList(
      new QueryWrapper().eq("user_id", id).select("role_id")
    );
    return rowsToCamel<{ roleId: string }>(list as any).map((r) =>
      String(r.roleId)
    );
  }

  async bindUserRole(dto: BindUserRoleDTO): Promise<void> {
    if (!dto?.userId?.trim()) throw new OrmError("参数错误");
    const userId = String(dto.userId).trim();
    await this.userRoleMapper.delete(
      new QueryWrapper().eq("user_id", userId)
    );
    const roleIds = Array.isArray(dto.roleIds) ? dto.roleIds : [];
    for (const roleId of roleIds) {
      if (roleId == null || String(roleId).trim() === "") continue;
      await this.userRoleMapper.insert({
        userId,
        roleId: String(roleId),
      });
    }
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRoleMapper.delete(new QueryWrapper().eq("user_id", id));
    await this.deleteById(id);
  }

  private async hasUser(
    username: string,
    id: string | null
  ): Promise<boolean> {
    const wrapper = new QueryWrapper().eq("username", username).select("id");
    if (id) wrapper.ne("id", id);
    const list = await this.selectList(wrapper);
    return list.length > 0;
  }
}
