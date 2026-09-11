import { ResponseCode } from "@/types/enums";

/** 鉴权相关错误基类，携带业务响应码 */
export class AuthError extends Error {
  readonly code: ResponseCode;

  constructor(message: string, code: ResponseCode) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

/** 未登录 */
export class NotLoginError extends AuthError {
  constructor(message = "未登录") {
    super(message, ResponseCode.UNAUTHORIZED);
    this.name = "NotLoginError";
  }
}

/** 无权限 */
export class NotPermissionError extends AuthError {
  constructor(message = "无此权限") {
    super(message, ResponseCode.FORBIDDEN);
    this.name = "NotPermissionError";
  }
}

/** 无角色 */
export class NotRoleError extends AuthError {
  constructor(message = "无此角色") {
    super(message, ResponseCode.FORBIDDEN);
    this.name = "NotRoleError";
  }
}
