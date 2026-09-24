import { TableField, TableId, TableName } from "@/framework/ORM";

/**
 * sys_config 表实体
 */
@TableName("sys_config")
export default class SysConfigEntity {
  @TableId()
  id!: string;

  @TableField({ value: "config_key" })
  configKey!: string;

  @TableField({ value: "config_name" })
  configName!: string;

  @TableField({ value: "config_value" })
  configValue?: string;

  @TableField({ value: "config_type" })
  configType?: string;

  @TableField()
  remark?: string;

  @TableField({ value: "public_flag" })
  publicFlag?: number;

  @TableField({ value: "sort_num" })
  sortNum?: number;

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
