import { TableField, TableId, TableName } from "@/framework/ORM";

/**
 * role 表实体（对齐 Java Role）
 */
@TableName("role")
export default class RoleEntity {
  @TableId()
  id!: string;

  @TableField()
  name!: string;

  @TableField({ value: "name_zh" })
  nameZh?: string;

  @TableField()
  description?: string;

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
}
