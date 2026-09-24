import { ResponseCode } from "@/framework/types/enums";

/** ORM 业务错误，携带响应码 */
export class OrmError extends Error {
  readonly code: ResponseCode;

  constructor(message: string, code: ResponseCode = ResponseCode.ERROR) {
    super(message);
    this.name = "OrmError";
    this.code = code;
  }
}

/** 乐观锁版本不匹配 */
export class OptimisticLockError extends OrmError {
  constructor(message = "数据已被修改，请刷新后重试") {
    super(message, ResponseCode.CONFLICT);
    this.name = "OptimisticLockError";
  }
}
