import { TableField, TableId, TableName } from "@/framework/ORM";

/**
 * sys_log 表实体（对齐 Java SysLog / pangza_admin.sql）
 */
@TableName("sys_log")
export default class SysLogEntity {
  @TableId()
  id!: number;

  @TableField()
  title?: string;

  @TableField()
  username?: string;

  @TableField()
  avatar?: string;

  @TableField({ value: "controller_name" })
  controllerName?: string;

  @TableField({ value: "method_name" })
  methodName?: string;

  /** 业务类型（存枚举序数字符串） */
  @TableField()
  business?: string;

  /** 操作端（0 手机 / 1 电脑 / 2 其他） */
  @TableField()
  oper?: string;

  @TableField()
  params?: string;

  @TableField()
  status?: string;

  @TableField({ value: "time_long" })
  timeLong?: number;

  @TableField()
  response?: string;

  @TableField({
    value: "create_time",
    insertFill: () => new Date(),
  })
  createTime?: Date;

  @TableField({ value: "create_by" })
  createBy?: string;

  @TableField({
    value: "update_time",
    insertFill: () => new Date(),
    updateFill: () => new Date(),
  })
  updateTime?: Date;

  @TableField({ value: "update_by" })
  updateBy?: string;

  @TableField()
  address?: string;

  @TableField()
  ip?: string;

  @TableField({ value: "user_agent" })
  userAgent?: string;

  @TableField()
  url?: string;

  @TableField({ value: "error_message" })
  errorMessage?: string;

  @TableField({
    value: "delete_flag",
    insertFill: 0,
  })
  deleteFlag?: number;
}
