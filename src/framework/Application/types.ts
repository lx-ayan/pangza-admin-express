import type { LogRecordOption } from "@/framework/Log";
import type { AuthCheckMode } from "@/framework/Auth";
import type {
  RateLimitOption,
  RepeatSubmitOption,
} from "@/framework/RateLimit";

/** 回调入参来源（RouteOption.paramType / 兼容旧写法） */
export enum ParamType {
  BODY = "body",
  QUERY = "query",
  PARAMS = "params",
  HEADER = "header",
  COOKIE = "cookie",
  PATH = "path",
}

/** 参数装饰器注入来源 */
export type ParamInjectSource =
  | "body"
  | "query"
  | "path"
  | "header"
  | "cookie";

/** 单个形参的注入元数据 */
export interface MethodParamMeta {
  /** 形参下标 */
  index: number;
  source: ParamInjectSource;
  /** @RequestPath(index) 时按路径参数顺序取值 */
  pathIndex?: number;
}

/** 路由级鉴权 / 入参 / 日志 / 限流 / 防重复提交配置 */
export interface RouteOption {
  auth?: {
    /** 需要的权限（需已注册 Auth） */
    permissions?: string[];
    /** 需要的角色（需已注册 Auth） */
    roles?: string[];
    /** 为 true 时跳过登录校验 */
    ignore?: boolean;
    /**
     * 角色数组校验模式，默认取 Auth.checkMode（OR）。
     * OR：命中任一角色；AND：必须具备全部角色。
     */
    roleMode?: AuthCheckMode;
    /**
     * 权限数组校验模式，默认取 Auth.checkMode（OR）。
     * OR：命中任一权限；AND：必须具备全部权限。
     */
    permissionMode?: AuthCheckMode;
  };
  /**
   * 操作日志：注册 Log 模块后生效。
   * 传 `{}` 或具体 title/business；ignore:true 跳过。
   */
  log?: LogRecordOption;
  /**
   * 接口限流（Redis Lua，对齐 Java @RateLimiter）。
   * 传 `{}` 使用默认 time=2/count=1。
   */
  rateLimit?: RateLimitOption;
  /**
   * 防重复提交（Redis，对齐 Java @RepeatSubmit）。
   * 传 `{}` 使用默认 interval=3000ms。
   */
  repeatSubmit?: RepeatSubmitOption;
  /** 回调入参来源；不传则仍传入 req（无参数装饰器时生效） */
  paramType?: ParamType;
  /** 参数装饰器元数据；有则按形参逐个注入 */
  params?: MethodParamMeta[];
  /**
   * 为 true 时不包装 ResponseData，回调签名为 (req, res)：
   * 用于文件下载 / 流式响应等。
   */
  raw?: boolean;
  /**
   * 为 true 时按 SSE 返回：自动写好 event-stream 头，回调签名 (req, res)，
   * 业务侧只需 `res.write('data: ...\\n\\n')` / `res.end()`。
   * 等价于 raw + 默认 SSE 头（也可用 `@Flux()`）。
   */
  flux?: boolean;
  /** @Validate 开启入参校验 */
  validate?: boolean;
  /** design:paramtypes，供 @Validate 使用 */
  paramTypes?: Function[];
}
