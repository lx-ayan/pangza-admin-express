import { mergeMethodLog } from "@/framework/Application/metadata";
import type { LogRecordOption } from "./types";

/**
 * 方法装饰器：为接口声明操作日志。
 * 推荐从 `@/framework/Application` 导入同名装饰器。
 */
export function LogDecorator(options: LogRecordOption = {}): MethodDecorator {
  return (target, propertyKey) => {
    mergeMethodLog(
      (target as object).constructor,
      String(propertyKey),
      options
    );
  };
}
