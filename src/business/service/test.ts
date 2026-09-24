import { BaseService, Service } from "@/framework/Service";
import TestMapper from "../mapper/test";

@Service(TestMapper)
export default class TestService extends BaseService {
  declare findByName: (
    table: string,
    name: string,
    flag: number
  ) => Promise<Record<string, unknown>[]>;

  declare findById: (
    id: string | number
  ) => Promise<Record<string, unknown>[]>;
}
