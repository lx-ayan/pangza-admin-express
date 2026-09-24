import {
  Mapper,
  MapperType,
  Param,
  Select,
} from "@/framework/Service";
import TestEntity from "@/business/entity/test";

/** 通过实体类绑定表名 / 主键 / TableField 填充 */
@Mapper(TestEntity, { fill: true })
class TestMapper extends MapperType {
  @Select(
    "SELECT * FROM ${table} WHERE name = #{name} AND delete_flag = #{flag}"
  )
  findByName(
    @Param("table") _table: string,
    @Param("name") _name: string,
    @Param("flag") _flag: number
  ): Promise<Record<string, unknown>[]> {
    return undefined as never;
  }

  @Select("SELECT * FROM test WHERE id = #{id} AND delete_flag = 0")
  findById(
    @Param("id") _id: string | number
  ): Promise<Record<string, unknown>[]> {
    return undefined as never;
  }
}

export default TestMapper;
