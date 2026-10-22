import { ResponseCode } from "@/framework/types/enums";

/** 限流 / 防重复提交业务错误（对齐 Java BusinessException，业务码 500） */
export class GuardError extends Error {
  readonly code: ResponseCode;

  constructor(message: string, code: ResponseCode = ResponseCode.ERROR) {
    super(message);
    this.name = "GuardError";
    this.code = code;
  }
}

/** 获取分布式锁失败 */
export class LockError extends Error {
  constructor(message = "获取锁失败") {
    super(message);
    this.name = "LockError";
  }
}
