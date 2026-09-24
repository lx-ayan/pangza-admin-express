import { Mapper, MapperType } from "@/framework/Service";
import TableConfigEntity from "@/business/entity/tableConfig";

@Mapper(TableConfigEntity, { logicDelete: true, fill: true })
export default class TableConfigMapper extends MapperType {}
