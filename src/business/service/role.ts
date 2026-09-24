import { BaseService, Resource, Service } from "@/framework/Service";
import { OrmError, QueryWrapper } from "@/framework/ORM";
import RoleMapper from "@/business/mapper/role";
import MenuRoleMapper from "@/business/mapper/menuRole";
import { rowsToCamel, rowToCamel } from "@/framework/utils/case";
import { nextId } from "@/framework/utils/id";
import {
  toPageResult,
  type PageRequest,
  type PageResult,
} from "@/framework/utils/entity/PageResult";

export interface CreateRoleDTO {
  name: string;
  nameZh: string;
  description?: string;
}

export interface BindMenuDTO {
  roleId: string;
  menuIds: string[];
}

export interface RolePageForm {
  name?: string;
}

@Service(RoleMapper)
export default class RoleService extends BaseService {
  @Resource(MenuRoleMapper)
  menuRoleMapper!: MenuRoleMapper;

  async getRolePage(
    pageRequest: PageRequest<RolePageForm>
  ): Promise<PageResult<Record<string, unknown>>> {
    const pageNum = pageRequest?.pageNum ?? 1;
    const pageSize = pageRequest?.pageSize ?? 10;
    const form = pageRequest?.form ?? {};

    const wrapper = new QueryWrapper();
    // 对齐 Java RolePageDTO：form.name 搜 name_zh
    if (form.name) wrapper.like("name_zh", form.name);

    const page = await this.selectPage(
      { current: pageNum, size: pageSize },
      wrapper
    );
    return toPageResult({
      ...page,
      records: rowsToCamel(page.records as any),
    });
  }

  async createRole(dto: CreateRoleDTO): Promise<void> {
    if (!dto?.name?.trim() || !dto?.nameZh?.trim()) {
      throw new OrmError("参数错误");
    }
    if (await this.hasRole(dto.name, null)) {
      throw new OrmError("当前角色已存在，请勿重复创建");
    }
    await this.insert({
      id: nextId(),
      name: dto.name.trim(),
      nameZh: dto.nameZh.trim(),
      description: dto.description,
    });
  }

  async updateRole(role: Record<string, unknown>): Promise<void> {
    const name = String(role.name ?? "").trim();
    const nameZh = String(role.nameZh ?? "").trim();
    const id = String(role.id ?? "");
    if (!name || !nameZh) throw new OrmError("参数错误");
    if (await this.hasRole(name, id)) {
      throw new OrmError("当前角色已存在，请勿重复创建");
    }
    await this.updateById({ ...role, id, name, nameZh });
  }

  async deleteRole(id: string): Promise<void> {
    await this.deleteById(id);
    await this.menuRoleMapper.delete(new QueryWrapper().eq("role_id", id));
  }

  async bindMenu(dto: BindMenuDTO): Promise<void> {
    if (!dto?.roleId) throw new OrmError("参数错误");
    await this.menuRoleMapper.delete(
      new QueryWrapper().eq("role_id", dto.roleId)
    );
    for (const menuId of dto.menuIds ?? []) {
      await this.menuRoleMapper.insert({
        roleId: dto.roleId,
        menuId: String(menuId),
      });
    }
  }

  async getRole(id: string): Promise<Record<string, unknown> | null> {
    return rowToCamel((await this.selectById(id)) as any);
  }

  async getRoleMenuIds(id: string): Promise<string[]> {
    const list = await this.menuRoleMapper.selectList(
      new QueryWrapper().eq("role_id", id).select("menu_id")
    );
    return rowsToCamel<{ menuId: string }>(list as any).map((r) =>
      String(r.menuId)
    );
  }

  async getRoleList(): Promise<Record<string, unknown>[]> {
    const list = await this.selectList(
      new QueryWrapper().select("id", "name", "name_zh", "description")
    );
    return rowsToCamel(list as any);
  }

  private async hasRole(
    name: string,
    id: string | null
  ): Promise<boolean> {
    const wrapper = new QueryWrapper().eq("name", name).select("id");
    if (id) wrapper.ne("id", id);
    const list = await this.selectList(wrapper);
    return list.length > 0;
  }
}
