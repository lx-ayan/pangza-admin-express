import { TableField, TableId, TableName } from "@/framework/ORM";

/** menu_role 关联表 */
@TableName("menu_role")
export default class MenuRoleEntity {
  @TableId()
  id?: number;

  @TableField({ value: "menu_id" })
  menuId!: string;

  @TableField({ value: "role_id" })
  roleId!: string;
}
