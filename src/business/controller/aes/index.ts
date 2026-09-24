import {
  AuthIgnore,
  Controller,
  GetMapping,
} from "@/framework/Application";
import { DynamicAesKeyManager } from "@/framework/encrypt/DynamicAesKeyManager";

@Controller("/api/aes")
export default class AesController {
  @GetMapping("/key")
  @AuthIgnore()
  getKey() {
    return DynamicAesKeyManager.generateDynamicKey();
  }
}
