import { Mapper, MapperType, Param, Select } from "@/framework/Service";
import UserEntity from "@/business/entity/user";

export interface NameAndPermission {
  name?: string;
  permission?: string;
}

/** user 表：实体注解 + 逻辑删除 */
@Mapper(UserEntity, { logicDelete: true, fill: true })
export default class UserMapper extends MapperType {
  /**
   * 对齐 Java UserMapper.getUserPermission：
   * select r.name, m.permission from role r
   *   LEFT JOIN user_role ur on ur.role_id = r.id
   *   LEFT JOIN menu_role mr on mr.role_id = r.id
   *   LEFT JOIN menu m on m.id = mr.menu_id
   * where ur.user_id = #{userId}
   */
  @Select(
    `SELECT r.name AS name, m.permission AS permission
     FROM role AS r
     LEFT JOIN user_role AS ur ON ur.role_id = r.id
     LEFT JOIN menu_role AS mr ON mr.role_id = r.id
     LEFT JOIN menu AS m ON m.id = mr.menu_id
     WHERE ur.user_id = #{userId}`
  )
  getUserPermission(
    @Param("userId") _userId: string
  ): Promise<NameAndPermission[]> {
    return undefined as never;
  }
}
