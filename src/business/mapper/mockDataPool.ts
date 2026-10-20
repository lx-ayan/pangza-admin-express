import { Mapper, MapperType } from "@/framework/Service";
import MockDataPoolEntity from "@/business/entity/mockDataPool";

@Mapper(MockDataPoolEntity)
export default class MockDataPoolMapper extends MapperType {}
