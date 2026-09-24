import TestService from "@/business/service/test";
import {
  AuthIgnore,
  Controller,
  DeleteMapping,
  GetMapping,
  RequestPath,
  RequestQuery,
} from "@/framework/Application";
import { Resource } from "@/framework/Service";

@Controller("/api/test")
class TestController {
  @Resource(TestService)
  testService!: TestService;

  @GetMapping("/test")
  @AuthIgnore()
  async test() {
    return this.testService.selectList();
  }

  @GetMapping("/create")
  @AuthIgnore()
  create(@RequestQuery() testDTO: { name: string }) {
    return this.testService.insert(testDTO);
  }

  @GetMapping("/by-name")
  @AuthIgnore()
  async byName(@RequestQuery() query: { name: string }) {
    return this.testService.findByName("test", query.name, 0);
  }

  @GetMapping("/find/:id")
  @AuthIgnore()
  async find(@RequestPath() id: string) {
    const rows = await this.testService.findById(id);
    return rows[0] ?? null;
  }

  @GetMapping("/delete/:id")
  @AuthIgnore()
  deleteTest(@RequestPath() id: string) {
    return this.testService.deleteById(id);
  }
}

export default TestController;
