import "reflect-metadata";
import type { RouteOption } from "./types";
import type { AuthCheckMode } from "@/framework/Auth";
import type { LogRecordOption } from "@/framework/Log";
import {
  addControllerRoute,
  addMethodParam,
  mergeMethodAuth,
  mergeMethodLog,
  mergeMethodFlux,
  setControllerPrefix,
  type HttpMethod,
} from "./metadata";

/** 标记该类为 Controller（供扫描识别） */
export const CONTROLLER_TYPE = Symbol.for("pangza.controller.type");

/**
 * 类装饰器：标记 Controller，并可设置统一路径前缀。
 * 类被加载时自动注册其中的 HTTP 路由（无需必须放在 business/controller）。
 *
 * @example
 * @Controller('/api/user')
 * class UserController { ... }
 */
export function Controller(prefix = ""): ClassDecorator {
  return (ctor) => {
    const Ctor = ctor as unknown as new () => object;
    setControllerPrefix(Ctor, prefix);
    Reflect.defineMetadata(CONTROLLER_TYPE, true, Ctor);
    // 延迟加载，避免 decorators ↔ Application 循环依赖
    const { default: Application } = require("./index") as {
      default: { registerController: (c: new () => object) => void };
    };
    Application.registerController(Ctor);
  };
}

export function isControllerClass(ctor: Function): boolean {
  return !!Reflect.getMetadata(CONTROLLER_TYPE, ctor);
}

function createHttpDecorator(method: HttpMethod) {
  return (path = "", option?: RouteOption): MethodDecorator => {
    return (target, propertyKey) => {
      const ctor = (target as object).constructor;
      addControllerRoute(ctor, {
        method,
        path,
        handlerName: String(propertyKey),
        option,
      });
    };
  };
}

/** 方法装饰器：注册 GET 接口（对齐 Spring @GetMapping） */
export const GetMapping = createHttpDecorator("GET");

/** 方法装饰器：注册 POST 接口（对齐 Spring @PostMapping） */
export const PostMapping = createHttpDecorator("POST");

/** 方法装饰器：注册 PUT 接口（对齐 Spring @PutMapping） */
export const PutMapping = createHttpDecorator("PUT");

/** 方法装饰器：注册 DELETE 接口（对齐 Spring @DeleteMapping） */
export const DeleteMapping = createHttpDecorator("DELETE");

export function AuthCheckLogin(): MethodDecorator {
  return (target, propertyKey) => {
    mergeMethodAuth((target as object).constructor, String(propertyKey), {});
  };
}

export function AuthCheckRole(
  roles: string[],
  option?: { mode?: AuthCheckMode }
): MethodDecorator {
  return (target, propertyKey) => {
    mergeMethodAuth((target as object).constructor, String(propertyKey), {
      roles,
      roleMode: option?.mode,
    });
  };
}

export function AuthCheckPermission(
  permissions: string[],
  option?: { mode?: AuthCheckMode }
): MethodDecorator {
  return (target, propertyKey) => {
    mergeMethodAuth((target as object).constructor, String(propertyKey), {
      permissions,
      permissionMode: option?.mode,
    });
  };
}

export function AuthIgnore(): MethodDecorator {
  return (target, propertyKey) => {
    mergeMethodAuth((target as object).constructor, String(propertyKey), {
      ignore: true,
    });
  };
}

/**
 * 操作日志装饰器（需 Application.registry(Log())）。
 * @example @Log({ title: '系统登录', business: BusinessType.LOGIN })
 */
export function Log(option: LogRecordOption = {}): MethodDecorator {
  return (target, propertyKey) => {
    mergeMethodLog((target as object).constructor, String(propertyKey), option);
  };
}

/**
 * 标记接口返回 SSE（Server-Sent Events）。
 * 框架自动写好 event-stream 头；可用 @RequestBody 等注入参数，未标注形参接收 res。
 *
 * @example
 * @PostMapping('/stream')
 * @Flux()
 * async stream(@RequestBody() body: any, res: Response) {
 *   res.write(`data: ${JSON.stringify(body)}\\n\\n`);
 *   res.end();
 * }
 */
export function Flux(): MethodDecorator {
  return (target, propertyKey) => {
    mergeMethodFlux((target as object).constructor, String(propertyKey), true);
  };
}

/** 注入 req.body；无参数装饰器时整段仍传 request */
export function RequestBody(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) return;
    addMethodParam((target as object).constructor, String(propertyKey), {
      index: parameterIndex,
      source: "body",
    });
  };
}

/** 注入 req.query */
export function RequestQuery(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) return;
    addMethodParam((target as object).constructor, String(propertyKey), {
      index: parameterIndex,
      source: "query",
    });
  };
}

/**
 * 注入路径参数。
 * - `@RequestPath()`：一个路径参数时直接传值，多个时传值数组
 * - `@RequestPath(0)`：按顺序取第 n 个路径参数
 */
export function RequestPath(index?: number): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) return;
    addMethodParam((target as object).constructor, String(propertyKey), {
      index: parameterIndex,
      source: "path",
      pathIndex: index,
    });
  };
}

/** 注入请求头 req.headers */
export function RequestHeader(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) return;
    addMethodParam((target as object).constructor, String(propertyKey), {
      index: parameterIndex,
      source: "header",
    });
  };
}

/** 注入 req.cookies（需自行挂 cookie 解析中间件） */
export function RequestCookie(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) return;
    addMethodParam((target as object).constructor, String(propertyKey), {
      index: parameterIndex,
      source: "cookie",
    });
  };
}

export {
  getControllerPrefix,
  getControllerRoutes,
  joinRoutePath,
} from "./metadata";
