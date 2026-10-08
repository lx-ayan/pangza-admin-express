import {
  AuthIgnore,
  Controller,
  GetMapping,
} from "@/framework/Application";
import { DynamicAesKeyManager } from "@/framework/encrypt";
// 挂载传输加密中间件（示例；删除本 controller / middleware 即关闭）
import "@/business/middleware/encryptTransport";

@Controller("/api/aes")
export default class AesController {
  @GetMapping("/key")
  @AuthIgnore()
  getKey() {
    return DynamicAesKeyManager.generateDynamicKey();
  }
}
