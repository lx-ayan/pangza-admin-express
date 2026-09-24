import { Mapper, MapperType } from "@/framework/Service";
import MenuRoleEntity from "@/business/entity/menuRole";

@Mapper(MenuRoleEntity, { logicDelete: false, fill: false })
export default class MenuRoleMapper extends MapperType {}
