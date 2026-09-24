import { TableField, TableId, TableName } from "@/framework/ORM";

/**
 * test 表实体（对齐 MyBatis-Plus 注解）
 */
@TableName("test")
export default class TestEntity {
  @TableId()
  id!: number;

  @TableField()
  name!: string;

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

  @TableField({
    value: "delete_flag",
    insertFill: 0,
  })
  deleteFlag?: number;
}
