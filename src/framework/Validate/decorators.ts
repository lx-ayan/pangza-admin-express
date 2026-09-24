import "reflect-metadata";
import {
  notNull,
  min,
  max,
  email,
  phone,
  custom,
} from "./rules";
import { mergeMethodValidate } from "@/framework/Application/metadata";
import { addBeanKey } from "@/framework/Json/beanKeys";
import type { ClassRuleMap, RuleOptions, ValidateRule } from "./types";

const RULES_KEY = Symbol.for("pangza.validate.rules");
const METHOD_VALIDATE_KEY = Symbol.for("pangza.validate.method");
const PARAM_TYPES_KEY = Symbol.for("pangza.validate.paramTypes");

type Ctor = Function;

function ruleMap(ctor: Ctor): ClassRuleMap {
  return (
    (Reflect.getOwnMetadata(RULES_KEY, ctor) as ClassRuleMap | undefined) ?? {}
  );
}

function addRule(ctor: Ctor, property: string, rule: ValidateRule): void {
  const map = { ...ruleMap(ctor) };
  map[property] = [...(map[property] ?? []), rule];
  Reflect.defineMetadata(RULES_KEY, map, ctor);
  addBeanKey(ctor, property);
}

function createPropDecorator(ruleFactory: () => ValidateRule): PropertyDecorator {
  return (target, propertyKey) => {
    addRule((target as object).constructor, String(propertyKey), ruleFactory());
  };
}

/** @NotNull() / @NotNull('用户名不能为空') / @NotNull({ message }) */
export function NotNull(options?: RuleOptions | string): PropertyDecorator {
  return createPropDecorator(() => notNull(options));
}

/** @Min(1) / @Min(1, '太小了') */
export function Min(
  minValue: number,
  options?: RuleOptions | string
): PropertyDecorator {
  return createPropDecorator(() => min(minValue, options));
}

/** @Max(100) */
export function Max(
  maxValue: number,
  options?: RuleOptions | string
): PropertyDecorator {
  return createPropDecorator(() => max(maxValue, options));
}

/** @Email() */
export function Email(options?: RuleOptions | string): PropertyDecorator {
  return createPropDecorator(() => email(options));
}

/** @Phone() / @Phone({ locale: 'zh-CN' }) */
export function Phone(
  options?: RuleOptions | string | { message?: string; locale?: any }
): PropertyDecorator {
  return createPropDecorator(() => phone(options));
}

/**
 * 自定义校验函数（对齐「注解传函数定制规则」）。
 * @example @Custom((v) => typeof v === 'string' && v.length > 2, '长度至少3')
 */
export function Custom(
  fn: (value: unknown, object: unknown) => boolean | Promise<boolean>,
  options?: RuleOptions | string
): PropertyDecorator {
  return createPropDecorator(() => custom(fn, options));
}

/** 读取类上的校验规则 */
export function getClassRules(ctor: Ctor): ClassRuleMap {
  return { ...ruleMap(ctor) };
}

/**
 * 方法装饰器：在路由执行前校验带规则的入参（依赖 emitDecoratorMetadata）。
 *
 * @example
 * @PostMapping('/create')
 * @Validate()
 * create(@RequestBody() body: CreateUserDTO) { ... }
 */
export function Validate(): MethodDecorator {
  return (target, propertyKey) => {
    const ctor = (target as object).constructor;
    const handlerName = String(propertyKey);
    const map =
      (Reflect.getMetadata(METHOD_VALIDATE_KEY, ctor) as
        | Record<string, boolean>
        | undefined) ?? {};
    map[handlerName] = true;
    Reflect.defineMetadata(METHOD_VALIDATE_KEY, map, ctor);

    const paramTypes =
      (Reflect.getMetadata("design:paramtypes", target, propertyKey) as
        | Function[]
        | undefined) ?? [];
    const typeMap =
      (Reflect.getMetadata(PARAM_TYPES_KEY, ctor) as
        | Record<string, Function[]>
        | undefined) ?? {};
    typeMap[handlerName] = paramTypes;
    Reflect.defineMetadata(PARAM_TYPES_KEY, typeMap, ctor);

    mergeMethodValidate(ctor, handlerName, true, paramTypes);
  };
}

export function isMethodValidate(ctor: Ctor, handlerName: string): boolean {
  const map =
    (Reflect.getMetadata(METHOD_VALIDATE_KEY, ctor) as
      | Record<string, boolean>
      | undefined) ?? {};
  return !!map[handlerName];
}

export function getMethodParamTypes(
  ctor: Ctor,
  handlerName: string
): Function[] {
  const map =
    (Reflect.getMetadata(PARAM_TYPES_KEY, ctor) as
      | Record<string, Function[]>
      | undefined) ?? {};
  return map[handlerName] ?? [];
}
