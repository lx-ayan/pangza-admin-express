import { Mapper, MapperType } from "@/framework/Service";
import MockDataPoolEntity from "@/business/entity/mockDataPool";

@Mapper(MockDataPoolEntity, { logicDelete: true, fill: true })
export default class MockDataPoolMapper extends MapperType {}
