import {
  AuthCheckRole,
  BusinessType,
  Controller,
  Log,
  PostMapping,
  RepeatSubmit,
  RequestBody,
  RequestPath,
} from "@/framework/Application";
import { Resource } from "@/framework/Service";
import MockDataPoolService, {
  type CreateMockDataPoolDTO,
  type MockDataPoolListForm,
  type MockDataPoolPageForm,
} from "@/business/service/mockDataPool";
import type { PageRequest } from "@/framework/utils/entity/PageResult";

@Controller("/api/mock_data")
export default class MockDataController {
  @Resource(MockDataPoolService)
  mockDataPoolService!: MockDataPoolService;

  @PostMapping("/list")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  @Log({ title: "获取数据池列表", business: BusinessType.LIST })
  list(@RequestBody() body?: MockDataPoolListForm) {
    return this.mockDataPoolService.getMockDataPoolList(body);
  }

  @PostMapping("/page")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  @Log({ title: "获取数据池分页", business: BusinessType.LIST })
  page(@RequestBody() body: PageRequest<MockDataPoolPageForm>) {
    return this.mockDataPoolService.getMockDataPoolPage(body);
  }

  @PostMapping("/create")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  @RepeatSubmit()
  @Log({ title: "创建数据池", business: BusinessType.CREATE })
  async create(@RequestBody() body: CreateMockDataPoolDTO) {
    await this.mockDataPoolService.createMockDataPool(body);
    return null;
  }

  @PostMapping("/update")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  @RepeatSubmit()
  @Log({ title: "修改数据池", business: BusinessType.UPDATE })
  async update(@RequestBody() body: Record<string, unknown>) {
    await this.mockDataPoolService.updateMockDataPool(body);
    return null;
  }

  @PostMapping("/delete/:id")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  @Log({ title: "删除数据池", business: BusinessType.DELETE })
  async delete(@RequestPath() id: string) {
    await this.mockDataPoolService.deleteMockDataPool(id);
    return null;
  }

  @PostMapping("/get/:id")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  get(@RequestPath() id: string) {
    return this.mockDataPoolService.getMockDataPool(id);
  }

  @PostMapping("/generate/:name")
  @AuthCheckRole(["ROLE_admin", "ROLE_developer"])
  generate(@RequestPath() name: string) {
    return this.mockDataPoolService.generateMockData(name);
  }
}
