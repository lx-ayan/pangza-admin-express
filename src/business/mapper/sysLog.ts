import { Mapper, MapperType } from "@/framework/Service";
import SysLogEntity from "@/business/entity/sysLog";

@Mapper(SysLogEntity, { logicDelete: true, fill: true })
export default class SysLogMapper extends MapperType {}
