import { BaseService, Resource, Service } from "@/framework/Service";
import { OrmError, QueryWrapper } from "@/framework/ORM";
import { AuthUtil } from "@/framework/Auth";
import MenuMapper from "@/business/mapper/menu";
import MenuRoleMapper from "@/business/mapper/menuRole";
import MenuEntity, { type MenuMeta } from "@/business/entity/menu";
import { rowToCamel, rowsToCamel } from "@/framework/utils/case";
import { nextId } from "@/framework/utils/id";
import {
  toPageResult,
  type PageRequest,
  type PageResult,
} from "@/framework/utils/entity/PageResult";

export interface CreateMenuDTO {
  name?: string;
  path?: string;
  title?: string;
  type?: string;
  permission?: string;
  auth?: number;
  hidden?: number;
  link?: number;
  frame?: number;
  href?: string;
  icon?: string;
  sortNum?: number;
  parentId?: string;
}

export interface BindRoleDTO {
  menuId: string;
  roleIds: string[];
}

export interface MenuPageForm {
  name?: string;
  title?: string;
  type?: string;
}

const TOP_LEVEL_TITLE = "顶级菜单";
const ROOT_PARENT = "-1";

function attachMeta(menu: Record<string, unknown>): Record<string, unknown> {
  const meta: MenuMeta = {
    title: menu.title as string | undefined,
    type: menu.type as string | undefined,
    permission: menu.permission as string | undefined,
    auth: menu.auth as number | undefined,
    hidden: menu.hidden as number | undefined,
    link: menu.link as number | undefined,
    frame: menu.frame as number | undefined,
    href: menu.href as string | undefined,
    icon: menu.icon as string | undefined,
    sortNum: menu.sortNum as number | undefined,
  };
  return { ...menu, meta };
}

function buildTree(
  flat: Record<string, unknown>[],
  parentId: string = ROOT_PARENT
): Record<string, unknown>[] {
  const children = flat
    .filter((m) => String(m.parentId ?? ROOT_PARENT) === parentId)
    .map((m) => {
      const node = attachMeta({ ...m });
      const kids = buildTree(flat, String(m.id));
      if (kids.length) node.children = kids;
      return node;
    });
  return children;
}

@Service(MenuMapper)
export default class MenuService extends BaseService {
  @Resource(MenuRoleMapper)
  menuRoleMapper!: MenuRoleMapper;

  declare selectAllMenus: () => Promise<Record<string, unknown>[]>;
  declare selectMenusByUserId: (
    userId: string
  ) => Promise<Record<string, unknown>[]>;

  /** 当前用户路由树 —— UI 启动关键 */
  async getUserRouter(): Promise<Record<string, unknown>[]> {
    const userId = String(await AuthUtil.getLoginId());
    const rows = rowsToCamel(await this.selectMenusByUserId(userId));
    return buildTree(rows, ROOT_PARENT);
  }

  /** 全量菜单树 */
  async getMenuWithChildren(): Promise<Record<string, unknown>[]> {
    const rows = rowsToCamel(await this.selectAllMenus());
    return buildTree(rows, ROOT_PARENT);
  }

  async getMenuPage(
    pageRequest: PageRequest<MenuPageForm>
  ): Promise<PageResult<Record<string, unknown>>> {
    const pageNum = pageRequest?.pageNum ?? 1;
    const pageSize = pageRequest?.pageSize ?? 10;
    const form = pageRequest?.form ?? {};

    const wrapper = new QueryWrapper();
    if (form.name) wrapper.like("name", form.name);
    if (form.title) wrapper.like("title", form.title);
    if (form.type) wrapper.eq("type", form.type);
    wrapper.orderByAsc("sort_num");

    const page = await this.selectPage(
      { current: pageNum, size: pageSize },
      wrapper
    );
    const list = rowsToCamel(page.records as any);
    await this.fillParentTitle(list);
    return toPageResult({ ...page, records: list });
  }

  private async fillParentTitle(menus: Record<string, unknown>[]): Promise<void> {
    if (!menus.length) return;
    const parentIds = [
      ...new Set(
        menus
          .map((m) => String(m.parentId ?? ""))
          .filter((id) => id && id !== ROOT_PARENT)
      ),
    ];
    const titleMap = new Map<string, string>();
    if (parentIds.length) {
      const parents = await this.selectList(
        new QueryWrapper().in("id", parentIds).select("id", "title")
      );
      for (const p of rowsToCamel(parents as any)) {
        titleMap.set(String(p.id), String(p.title ?? ""));
      }
    }
    for (const menu of menus) {
      const pid = String(menu.parentId ?? ROOT_PARENT);
      if (!pid || pid === ROOT_PARENT) {
        menu.parentTitle = TOP_LEVEL_TITLE;
      } else {
        menu.parentTitle = titleMap.get(pid) ?? "";
      }
    }
  }

  async saveMenu(dto: CreateMenuDTO): Promise<void> {
    if (!dto?.title?.trim() || !dto?.path?.trim() || !dto?.type?.trim()) {
      throw new OrmError("参数错误");
    }
    await this.insert({
      id: nextId(),
      name: dto.name,
      path: dto.path,
      title: dto.title,
      type: dto.type,
      permission: dto.permission,
      auth: dto.auth,
      hidden: dto.hidden,
      link: dto.link,
      frame: dto.frame,
      href: dto.href,
      icon: dto.icon,
      sortNum: dto.sortNum,
      parentId: dto.parentId || ROOT_PARENT,
    } as Partial<MenuEntity>);
  }

  async updateMenu(menu: Record<string, unknown>): Promise<void> {
    if (!menu?.title || !menu?.path || !menu?.permission || !menu?.type) {
      throw new OrmError("参数错误");
    }
    if (!menu.id) throw new OrmError("参数错误");
    await this.updateById(menu);
  }

  async getMenuById(id: string): Promise<Record<string, unknown> | null> {
    // BaseMapper.selectById 会自动填充 eager 字段级 @Select（如 roleName）
    return rowToCamel((await this.selectById(id)) as any);
  }

  async deleteMenu(id: string): Promise<void> {
    await this.menuRoleMapper.delete(new QueryWrapper().eq("menu_id", id));
    await this.deleteById(id);
  }

  async getMenuRoleIds(menuId: string): Promise<string[]> {
    const list = await this.menuRoleMapper.selectList(
      new QueryWrapper().eq("menu_id", menuId).select("role_id")
    );
    return rowsToCamel<{ roleId: string }>(list as any).map((r) =>
      String(r.roleId)
    );
  }

  async bindRole(dto: BindRoleDTO): Promise<void> {
    if (!dto?.menuId) throw new OrmError("参数错误");
    await this.menuRoleMapper.delete(
      new QueryWrapper().eq("menu_id", dto.menuId)
    );
    for (const roleId of dto.roleIds ?? []) {
      await this.menuRoleMapper.insert({
        menuId: dto.menuId,
        roleId: String(roleId),
      });
    }
  }
}
