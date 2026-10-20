import { IdType, TableField, TableId, TableName } from "@/framework/ORM";

/** user_role 关联表 */
@TableName("user_role")
export default class UserRoleEntity {
  @TableId({ type: IdType.AUTO })
  id?: number;

  @TableField({ value: "user_id" })
  userId!: string;

  @TableField({ value: "role_id" })
  roleId!: string;
}
