import { TableField, TableId, TableName } from "@/framework/ORM";

/**
 * mock_data_pool 表实体
 */
@TableName("mock_data_pool")
export default class MockDataPoolEntity {
  @TableId()
  id!: string;

  @TableField()
  name!: string;

  @TableField()
  description?: string;

  /** 数据内容，JSON 数组 */
  @TableField({ value: "data_content" })
  dataContent!: string;

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
