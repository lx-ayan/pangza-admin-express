import { Mapper, MapperType } from "@/framework/Service";
import SysScheduleEntity from "@/business/entity/sysSchedule";

@Mapper(SysScheduleEntity, { logicDelete: true, fill: true })
export default class SysScheduleMapper extends MapperType {}
