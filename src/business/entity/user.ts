import { TableField, TableId, TableName } from "@/framework/ORM";
import { JsonFormat, JsonInclude, JsonIncludeType } from "@/framework/Json";

/**
 * user 表实体（对齐 Java User）
 */
@TableName("user")
@JsonInclude(JsonIncludeType.NON_NULL)
export default class UserEntity {
  @TableId()
  id!: string;

  @TableField()
  username!: string;

  @TableField()
  password?: string;

  @TableField()
  avatar?: string;

  @TableField({ value: "nick_name" })
  nickName?: string;

  @TableField()
  phone?: string;

  @TableField()
  email?: string;

  @TableField()
  address?: string;

  @TableField({
    value: "create_time",
    insertFill: () => new Date(),
  })
  @JsonFormat({ pattern: "yyyy-MM-dd HH:mm:ss" })
  createTime?: Date;

  @TableField({
    value: "update_time",
    insertFill: () => new Date(),
    updateFill: () => new Date(),
  })
  @JsonFormat({ pattern: "yyyy-MM-dd HH:mm:ss" })
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
