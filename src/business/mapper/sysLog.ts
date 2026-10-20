import { Mapper, MapperType } from "@/framework/Service";
import SysLogEntity from "@/business/entity/sysLog";

@Mapper(SysLogEntity)
export default class SysLogMapper extends MapperType {}
