import { Mapper, MapperType } from "@/framework/Service";
import RoleEntity from "@/business/entity/role";

@Mapper(RoleEntity, { logicDelete: true, fill: true })
export default class RoleMapper extends MapperType {}
