import "reflect-metadata";
import type { MethodParamMeta, RouteOption } from "./types";
import type { LogRecordOption } from "@/framework/Log";
import type {
  RateLimitOption,
  RepeatSubmitOption,
} from "@/framework/RateLimit";

/** HTTP 方法 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/** 方法路由元数据 */
export interface RouteMeta {
  method: HttpMethod;
  path: string;
  handlerName: string;
  option?: RouteOption;
}

const PREFIX_KEY = Symbol.for("pangza.controller.prefix");
const ROUTES_KEY = Symbol.for("pangza.controller.routes");
const AUTH_KEY = Symbol.for("pangza.controller.methodAuth");
const LOG_KEY = Symbol.for("pangza.controller.methodLog");
const RATE_LIMIT_KEY = Symbol.for("pangza.controller.methodRateLimit");
const REPEAT_SUBMIT_KEY = Symbol.for("pangza.controller.methodRepeatSubmit");
const PARAMS_KEY = Symbol.for("pangza.controller.methodParams");
const VALIDATE_KEY = Symbol.for("pangza.controller.methodValidate");
const PARAM_TYPES_KEY = Symbol.for("pangza.controller.methodParamTypes");
const FLUX_KEY = Symbol.for("pangza.controller.methodFlux");

/** 读取 Controller 前缀 */
export function getControllerPrefix(ctor: Function): string {
  return (Reflect.getMetadata(PREFIX_KEY, ctor) as string) ?? "";
}

/** 写入 Controller 前缀 */
export function setControllerPrefix(ctor: Function, prefix: string): void {
  Reflect.defineMetadata(PREFIX_KEY, prefix, ctor);
}

/** 读取类上挂载的路由列表 */
export function getControllerRoutes(ctor: Function): RouteMeta[] {
  return (Reflect.getMetadata(ROUTES_KEY, ctor) as RouteMeta[]) ?? [];
}

/** 追加一条方法路由元数据（方法装饰器阶段调用） */
export function addControllerRoute(ctor: Function, meta: RouteMeta): void {
  const routes = getControllerRoutes(ctor);
  const auth = getMethodAuth(ctor, meta.handlerName);
  const log = getMethodLog(ctor, meta.handlerName);
  const rateLimit = getMethodRateLimit(ctor, meta.handlerName);
  const repeatSubmit = getMethodRepeatSubmit(ctor, meta.handlerName);
  const params = getMethodParams(ctor, meta.handlerName);
  const validate = getMethodValidate(ctor, meta.handlerName);
  const paramTypes = getMethodParamTypes(ctor, meta.handlerName);
  const flux = getMethodFlux(ctor, meta.handlerName);
  let option = mergeRouteOption(meta.option, {
    auth,
    log,
    rateLimit,
    repeatSubmit,
    validate,
    paramTypes,
    flux,
  });
  routes.push({
    ...meta,
    option: {
      ...option,
      params: params.length ? params : option?.params,
    },
  });
  Reflect.defineMetadata(ROUTES_KEY, routes, ctor);
}

/** 读取方法参数注入元数据 */
export function getMethodParams(
  ctor: Function,
  handlerName: string
): MethodParamMeta[] {
  const map =
    (Reflect.getMetadata(PARAMS_KEY, ctor) as Record<
      string,
      MethodParamMeta[]
    >) ?? {};
  return map[handlerName] ?? [];
}

/** 写入某个形参的注入元数据（参数装饰器阶段） */
export function addMethodParam(
  ctor: Function,
  handlerName: string,
  meta: MethodParamMeta
): void {
  const map =
    (Reflect.getMetadata(PARAMS_KEY, ctor) as Record<
      string,
      MethodParamMeta[]
    >) ?? {};
  const list = map[handlerName] ? [...map[handlerName]] : [];
  const exist = list.findIndex((item) => item.index === meta.index);
  if (exist >= 0) {
    list[exist] = meta;
  } else {
    list.push(meta);
  }
  list.sort((a, b) => a.index - b.index);
  map[handlerName] = list;
  Reflect.defineMetadata(PARAMS_KEY, map, ctor);

  const routes = getControllerRoutes(ctor);
  for (const route of routes) {
    if (route.handlerName === handlerName) {
      route.option = {
        ...route.option,
        params: list,
      };
    }
  }
  Reflect.defineMetadata(ROUTES_KEY, routes, ctor);
}

/** 读取方法上的鉴权元数据 */
export function getMethodAuth(
  ctor: Function,
  handlerName: string
): NonNullable<RouteOption["auth"]> | undefined {
  const map =
    (Reflect.getMetadata(AUTH_KEY, ctor) as Record<
      string,
      NonNullable<RouteOption["auth"]>
    >) ?? {};
  return map[handlerName];
}

/** 合并 AuthCheck* 到方法元数据，并回写已注册路由 */
export function mergeMethodAuth(
  ctor: Function,
  handlerName: string,
  patch: NonNullable<RouteOption["auth"]>
): void {
  const map =
    (Reflect.getMetadata(AUTH_KEY, ctor) as Record<
      string,
      NonNullable<RouteOption["auth"]>
    >) ?? {};
  map[handlerName] = mergeAuth(map[handlerName], patch);
  Reflect.defineMetadata(AUTH_KEY, map, ctor);
  rewriteRouteOption(ctor, handlerName, { auth: map[handlerName] });
}

export function getMethodLog(
  ctor: Function,
  handlerName: string
): LogRecordOption | undefined {
  const map =
    (Reflect.getMetadata(LOG_KEY, ctor) as Record<string, LogRecordOption>) ??
    {};
  return map[handlerName];
}

/** 合并 @Log 到方法元数据，并回写已注册路由 */
export function mergeMethodLog(
  ctor: Function,
  handlerName: string,
  patch: LogRecordOption
): void {
  const map =
    (Reflect.getMetadata(LOG_KEY, ctor) as Record<string, LogRecordOption>) ??
    {};
  map[handlerName] = { ...(map[handlerName] ?? {}), ...patch };
  Reflect.defineMetadata(LOG_KEY, map, ctor);
  rewriteRouteOption(ctor, handlerName, { log: map[handlerName] });
}

export function getMethodRateLimit(
  ctor: Function,
  handlerName: string
): RateLimitOption | undefined {
  const map =
    (Reflect.getMetadata(RATE_LIMIT_KEY, ctor) as Record<
      string,
      RateLimitOption
    >) ?? {};
  return map[handlerName];
}

export function mergeMethodRateLimit(
  ctor: Function,
  handlerName: string,
  patch: RateLimitOption
): void {
  const map =
    (Reflect.getMetadata(RATE_LIMIT_KEY, ctor) as Record<
      string,
      RateLimitOption
    >) ?? {};
  map[handlerName] = { ...(map[handlerName] ?? {}), ...patch };
  Reflect.defineMetadata(RATE_LIMIT_KEY, map, ctor);
  rewriteRouteOption(ctor, handlerName, { rateLimit: map[handlerName] });
}

export function getMethodRepeatSubmit(
  ctor: Function,
  handlerName: string
): RepeatSubmitOption | undefined {
  const map =
    (Reflect.getMetadata(REPEAT_SUBMIT_KEY, ctor) as Record<
      string,
      RepeatSubmitOption
    >) ?? {};
  return map[handlerName];
}

export function mergeMethodRepeatSubmit(
  ctor: Function,
  handlerName: string,
  patch: RepeatSubmitOption
): void {
  const map =
    (Reflect.getMetadata(REPEAT_SUBMIT_KEY, ctor) as Record<
      string,
      RepeatSubmitOption
    >) ?? {};
  map[handlerName] = { ...(map[handlerName] ?? {}), ...patch };
  Reflect.defineMetadata(REPEAT_SUBMIT_KEY, map, ctor);
  rewriteRouteOption(ctor, handlerName, { repeatSubmit: map[handlerName] });
}

export function getMethodValidate(
  ctor: Function,
  handlerName: string
): boolean | undefined {
  const map =
    (Reflect.getMetadata(VALIDATE_KEY, ctor) as Record<string, boolean>) ?? {};
  return map[handlerName];
}

export function getMethodParamTypes(
  ctor: Function,
  handlerName: string
): Function[] | undefined {
  const map =
    (Reflect.getMetadata(PARAM_TYPES_KEY, ctor) as Record<
      string,
      Function[]
    >) ?? {};
  return map[handlerName];
}

/** 合并 @Validate 到方法元数据，并回写已注册路由 */
export function mergeMethodValidate(
  ctor: Function,
  handlerName: string,
  enabled: boolean,
  paramTypes: Function[] = []
): void {
  const flagMap =
    (Reflect.getMetadata(VALIDATE_KEY, ctor) as Record<string, boolean>) ?? {};
  flagMap[handlerName] = enabled;
  Reflect.defineMetadata(VALIDATE_KEY, flagMap, ctor);

  const typeMap =
    (Reflect.getMetadata(PARAM_TYPES_KEY, ctor) as Record<
      string,
      Function[]
    >) ?? {};
  typeMap[handlerName] = paramTypes;
  Reflect.defineMetadata(PARAM_TYPES_KEY, typeMap, ctor);

  rewriteRouteOption(ctor, handlerName, {
    validate: enabled,
    paramTypes,
  });
}

function rewriteRouteOption(
  ctor: Function,
  handlerName: string,
  patch: Partial<RouteOption>
): void {
  const routes = getControllerRoutes(ctor);
  for (const route of routes) {
    if (route.handlerName === handlerName) {
      route.option = mergeRouteOption(route.option, patch);
    }
  }
  Reflect.defineMetadata(ROUTES_KEY, routes, ctor);
}

function mergeAuth(
  base: NonNullable<RouteOption["auth"]> | undefined,
  patch: NonNullable<RouteOption["auth"]>
): NonNullable<RouteOption["auth"]> {
  return {
    ignore: patch.ignore ?? base?.ignore,
    roles: [...(base?.roles ?? []), ...(patch.roles ?? [])],
    permissions: [...(base?.permissions ?? []), ...(patch.permissions ?? [])],
    roleMode: patch.roleMode ?? base?.roleMode,
    permissionMode: patch.permissionMode ?? base?.permissionMode,
  };
}

export function getMethodFlux(
  ctor: Function,
  handlerName: string
): boolean | undefined {
  const map =
    (Reflect.getMetadata(FLUX_KEY, ctor) as Record<string, boolean>) ?? {};
  return map[handlerName];
}

/** 合并 @Flux 到方法元数据，并回写已注册路由 */
export function mergeMethodFlux(
  ctor: Function,
  handlerName: string,
  value = true
): void {
  const map =
    (Reflect.getMetadata(FLUX_KEY, ctor) as Record<string, boolean>) ?? {};
  map[handlerName] = value;
  Reflect.defineMetadata(FLUX_KEY, map, ctor);
  rewriteRouteOption(ctor, handlerName, { flux: value });
}

function mergeRouteOption(
  option: RouteOption | undefined,
  patch: {
    auth?: NonNullable<RouteOption["auth"]>;
    log?: LogRecordOption;
    rateLimit?: RateLimitOption;
    repeatSubmit?: RepeatSubmitOption;
    validate?: boolean;
    paramTypes?: Function[];
    flux?: boolean;
  } = {}
): RouteOption | undefined {
  if (
    !patch.auth &&
    !patch.log &&
    !patch.rateLimit &&
    !patch.repeatSubmit &&
    patch.validate === undefined &&
    !patch.paramTypes &&
    patch.flux === undefined
  ) {
    return option;
  }
  return {
    ...option,
    auth: patch.auth
      ? mergeAuth(option?.auth, patch.auth)
      : option?.auth,
    log: patch.log
      ? { ...(option?.log ?? {}), ...patch.log }
      : option?.log,
    rateLimit: patch.rateLimit
      ? { ...(option?.rateLimit ?? {}), ...patch.rateLimit }
      : option?.rateLimit,
    repeatSubmit: patch.repeatSubmit
      ? { ...(option?.repeatSubmit ?? {}), ...patch.repeatSubmit }
      : option?.repeatSubmit,
    validate:
      patch.validate !== undefined ? patch.validate : option?.validate,
    paramTypes: patch.paramTypes ?? option?.paramTypes,
    flux: patch.flux !== undefined ? patch.flux : option?.flux,
  };
}

/** 拼接类前缀与方法路径，避免双斜杠 */
export function joinRoutePath(prefix: string, sub: string): string {
  const p = (prefix || "").trim().replace(/\/+$/, "");
  const s = (sub || "").trim().replace(/^\/+/, "");
  if (!p && !s) return "/";
  if (!p) return `/${s}`;
  if (!s) return p.startsWith("/") ? p : `/${p}`;
  const base = p.startsWith("/") ? p : `/${p}`;
  return `${base}/${s}`;
}
