import { TableField, TableId, TableName } from "@/framework/ORM";

/**
 * sys_schedule 表实体
 */
@TableName("sys_schedule")
export default class SysScheduleEntity {
  @TableId()
  id!: string;

  @TableField()
  title!: string;

  @TableField()
  cron!: string;

  @TableField({ value: "bean_name" })
  beanName!: string;

  @TableField()
  description?: string;

  /** 状态：1启用 0停用 */
  @TableField()
  status?: number;

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
