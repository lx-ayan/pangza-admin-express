import { ResponseCode } from "@/framework/types/enums";

/** 单条校验规则 */
export interface ValidateRule {
  name: string;
  message: string;
  validate: (value: unknown, object: unknown) => boolean | Promise<boolean>;
}

/** 规则工厂可选配置 */
export interface RuleOptions {
  message?: string;
}

/** 字段错误明细 */
export interface FieldError {
  field: string;
  message: string;
  rule: string;
}

/** 校验失败异常 */
export class ValidationError extends Error {
  readonly code = ResponseCode.BAD_REQUEST;
  readonly errors: FieldError[];

  constructor(errors: FieldError[], message?: string) {
    const msg =
      message ||
      errors.map((e) => e.message).join("; ") ||
      "参数校验失败";
    super(msg);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

/** 类字段规则表 */
export type ClassRuleMap = Record<string, ValidateRule[]>;

/** validateHandler 的 schema：类 或 字段规则表 */
export type ValidatorParam = Function | ClassRuleMap;
