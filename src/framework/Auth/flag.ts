/** 用于标记 Auth 中间件，供 Application 识别是否已注册鉴权模块 */
export const AUTH_MIDDLEWARE_FLAG = Symbol.for("pangza.auth.middleware");
