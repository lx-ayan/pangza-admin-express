import { getClassRules } from "./decorators";
import type {
  ClassRuleMap,
  FieldError,
  ValidateRule,
  ValidatorParam,
} from "./types";
import { ValidationError } from "./types";

function isClassSchema(schema: ValidatorParam): schema is Function {
  return typeof schema === "function";
}

function resolveRules(schema: ValidatorParam): ClassRuleMap {
  if (isClassSchema(schema)) {
    return getClassRules(schema);
  }
  return schema ?? {};
}

/**
 * 函数式校验（对齐 Spring Validator / @Valid）。
 * 失败抛出 ValidationError。
 *
 * @example
 * validateHandler(body, CreateUserDTO);
 * validateHandler(body, {
 *   email: [email('邮箱不对'), notNull()],
 *   age: [min(1), max(120)],
 * });
 */
export async function validateHandler(
  data: unknown,
  schema: ValidatorParam
): Promise<void> {
  const rules = resolveRules(schema);
  const errors: FieldError[] = [];
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const list = fieldRules as ValidateRule[];
    const value = obj[field];
    for (const rule of list) {
      const ok = await rule.validate(value, data);
      if (!ok) {
        errors.push({
          field,
          message: rule.message,
          rule: rule.name,
        });
        break; // 同一字段遇错即停，类似默认 Spring 行为可简化
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

/** 同步版本：规则内不要用 async */
export function validateHandlerSync(
  data: unknown,
  schema: ValidatorParam
): void {
  const rules = resolveRules(schema);
  const errors: FieldError[] = [];
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = obj[field];
    for (const rule of fieldRules) {
      const result = rule.validate(value, data);
      const ok = typeof result === "boolean" ? result : false;
      if (!ok) {
        errors.push({ field, message: rule.message, rule: rule.name });
        break;
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}

const SKIP_TYPES = new Set<Function>([
  Object,
  String,
  Number,
  Boolean,
  Array,
  Function,
]);

/**
 * 按 design:paramtypes 校验方法入参（供 Application 调用）。
 */
export async function validateMethodArgs(
  args: unknown[],
  paramTypes: Function[] = []
): Promise<void> {
  for (let i = 0; i < paramTypes.length; i++) {
    const Type = paramTypes[i];
    if (!Type || SKIP_TYPES.has(Type)) continue;
    // Express Request 等无规则的类直接跳过
    const rules = getClassRules(Type);
    if (Object.keys(rules).length === 0) continue;
    await validateHandler(args[i], Type);
  }
}
