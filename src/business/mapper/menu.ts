import { Mapper, MapperType, Param, Select } from "@/framework/Service";
import MenuEntity from "@/business/entity/menu";

@Mapper(MenuEntity, { logicDelete: true, fill: true })
export default class MenuMapper extends MapperType {
  /** 全量未删除菜单，按 sort_num 排序（内存组树） */
  @Select(
    `SELECT id, name, path, title, type, permission, auth, hidden, link, frame,
            href, icon, sort_num, parent_id, create_time, update_time, delete_flag
     FROM menu
     WHERE delete_flag = 0
     ORDER BY sort_num ASC`
  )
  selectAllMenus(): Promise<Record<string, unknown>[]> {
    return undefined as never;
  }

  /**
   * 当前用户可见菜单（排除按钮 type=2）
   * 对齐 MenuMapper.xml：user_role → menu_role → menu，避免 ONLY_FULL_GROUP_BY 问题
   */
  @Select(
    `SELECT m.id, m.name, m.path, m.title, m.type, m.permission, m.auth, m.hidden,
            m.link, m.frame, m.href, m.icon, m.sort_num, m.parent_id, m.delete_flag
     FROM menu m
     WHERE m.id IN (
       SELECT mr.menu_id
       FROM menu_role mr
       INNER JOIN user_role ur ON ur.role_id = mr.role_id
       WHERE ur.user_id = #{userId}
     )
       AND m.type != '2'
       AND (m.delete_flag IS NULL OR m.delete_flag != 1)
     ORDER BY m.sort_num ASC`
  )
  selectMenusByUserId(
    @Param("userId") _userId: string
  ): Promise<Record<string, unknown>[]> {
    return undefined as never;
  }
}
