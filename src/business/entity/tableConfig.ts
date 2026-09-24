import { TableField, TableId, TableName } from "@/framework/ORM";

/**
 * table_config 表实体
 */
@TableName("table_config")
export default class TableConfigEntity {
  @TableId()
  id!: string;

  @TableField({ value: "table_name" })
  tableName!: string;

  @TableField({ value: "table_comment" })
  tableComment?: string;

  /** 字段配置 JSON 数组，或 { fields, genConfig } 对象 */
  @TableField({ value: "field_config" })
  fieldConfig!: string;

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
