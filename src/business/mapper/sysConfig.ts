import { Mapper, MapperType } from "@/framework/Service";
import SysConfigEntity from "@/business/entity/sysConfig";

@Mapper(SysConfigEntity, { logicDelete: true, fill: true })
export default class SysConfigMapper extends MapperType {}
