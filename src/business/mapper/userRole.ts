import { Mapper, MapperType } from "@/framework/Service";
import UserRoleEntity from "@/business/entity/userRole";

/** user_role：无逻辑删除 */
@Mapper(UserRoleEntity, { logicDelete: false, fill: false })
export default class UserRoleMapper extends MapperType {}
