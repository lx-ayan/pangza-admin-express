import { Select, TableField, TableId, TableName } from "@/framework/ORM";

/** 路由 meta（非表字段，组装返回） */
export interface MenuMeta {
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
}

/**
 * menu 表实体（对齐 Java Menu）
 */
@TableName("menu")
export default class MenuEntity {
  @TableId()
  id!: string;

  @TableField()
  name!: string;

  @TableField()
  path?: string;

  @TableField()
  title!: string;

  @TableField()
  type?: string;

  @TableField()
  permission?: string;

  @TableField()
  auth?: number;

  @TableField()
  hidden?: number;

  @TableField()
  link?: number;

  @TableField()
  frame?: number;

  @TableField()
  href?: string;

  @TableField()
  icon?: string;

  @TableField({ value: "sort_num" })
  sortNum?: number;

  @TableField({ value: "parent_id" })
  parentId?: string;

  @TableField({
    value: "create_time",
    insertFill: () => new Date(),
  })
  createTime?: Date;

  @TableField({
    value: "update_time",
    insertFill: () => new Date(),
    updateFill: () => new Date(),
  })
  updateTime?: Date;

  @TableField({ value: "create_by" })
  createBy?: string;

  @TableField({ value: "update_by" })
  updateBy?: string;

  @TableField({
    value: "delete_flag",
    insertFill: 0,
  })
  deleteFlag?: number;

  /**
   * 子菜单：字段级 @Select，父行用 #{id} 绑定。
   * eager:false — 全表查询时不自动 N+1；需要时手动：
   * hydrateFieldSelects(MenuEntity, [row], { includeLazy: true, properties: ['children'] })
   */
  @TableField({ exist: false })
  @Select(
    `SELECT id, name, path, title, type, permission, auth, hidden, link, frame,
            href, icon, sort_num, parent_id, create_time, update_time, delete_flag
     FROM menu
     WHERE parent_id = #{id} AND (delete_flag IS NULL OR delete_flag != 1)
     ORDER BY sort_num ASC`,
    { many: true, eager: false, depth: 0 }
  )
  children?: MenuEntity[];

  @TableField({ exist: false })
  meta?: MenuMeta;

  @TableField({ exist: false })
  parentTitle?: string;

  /**
   * 关联角色名示例：子查询结果映射到字段。
   * #{id} 取自父行；column: 'name' 取标量。
   * selectById / selectList 等会自动填充（eager 默认 true）。
   */
  @TableField({ exist: false })
  @Select(
    `SELECT name FROM role
     WHERE id = (
       SELECT role_id FROM menu_role WHERE menu_id = #{id} LIMIT 1
     )`,
    { column: "name" }
  )
  roleName?: string;
}
