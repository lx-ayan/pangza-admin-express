import express, { Express, Router, Request } from 'express';
import fs from 'fs';
import path from 'path';
import { PORT } from '@/framework/config';
import ResponseData from '@/framework/utils/entity/ResponseData';
import { AUTH_MIDDLEWARE_FLAG, AuthError, AuthUtil, getAuthOptions, isGloballyIgnored } from '@/framework/Auth';
import {
    LOG_MIDDLEWARE_FLAG,
    isLogRegistered,
    recordOperationLog,
} from '@/framework/Log';
import { getClientIp } from '@/framework/Log/ip';
import { getLogger } from '@/framework/Logger';
import { OrmError } from '@/framework/ORM';
import {
    applyRateLimit,
    applyRepeatSubmit,
    GuardError,
} from '@/framework/Redis';
import { ObjectMapper } from '@/framework/Json';
import { handleException } from '@/framework/Exception';
import { validateMethodArgs, ValidationError } from '@/framework/Validate';
import {
    getControllerPrefix,
    getControllerRoutes,
    joinRoutePath,
} from './metadata';
import type { RouteOption } from './types';
import { ParamType } from './types';
import {
    resolveCallbackArgs,
    resolveRawCallbackArgs,
} from './callbackArgs';

const log = getLogger('Application');

type RouteRuntimeMeta = RouteOption & {
    __controllerName?: string;
    __handlerName?: string;
};

let __isStart = false;

const app: Express = express();

const router = Router();

export function applicationStart() {
    return app.listen(PORT, () => {
        log.info(`Server is running on port ${PORT}`);
    });
}

const originalListen = app.listen.bind(app);

app.listen = function (...args: Parameters<typeof originalListen>) {
    if (__isStart) {
        throw new Error('Application already started');
    }
    __isStart = true;
    return originalListen(...args);
} as typeof app.listen;

/** 判断中间件是否为 Auth 模块 */
function isAuthMiddleware(param: unknown): boolean {
    return typeof param === 'function' && !!(param as any)[AUTH_MIDDLEWARE_FLAG];
}

/** 判断中间件是否为 Log 模块 */
function isLogMiddleware(param: unknown): boolean {
    return typeof param === 'function' && !!(param as any)[LOG_MIDDLEWARE_FLAG];
}

function resolveLogStatus(error: unknown): string {
    if (!error) return '200';
    if (
        error instanceof AuthError ||
        error instanceof OrmError ||
        error instanceof GuardError ||
        error instanceof ValidationError
    ) {
        return String(error.code ?? 500);
    }
    return '500';
}

class Application {
    private static routerMounted = false;
    private static controllersLoaded = false;
    /** 是否已通过 registry 注册 Auth 中间件 */
    private static authRegistered = false;
    /** 是否已通过 registry 注册 Log 中间件 */
    private static logRegistered = false;
    /** 已注册过的 Controller，防止重复挂路由 */
    private static registeredControllers = new WeakSet<Function>();
    /** 已 require 过的模块文件 */
    private static loadedFiles = new Set<string>();
    /**
     * 自定义扫描根目录（绝对路径）。
     * 未调用 scan() 时默认扫描 src/business。
     */
    private static scanRoots: string[] = [];

    static getApp() {
        return app;
    }

    /** 是否已注册 Auth 模块 */
    static hasAuth() {
        return this.authRegistered;
    }

    /** 是否已注册 Log 模块 */
    static hasLog() {
        return this.logRegistered || isLogRegistered();
    }

    /**
     * 追加模块扫描目录（可多次调用）。
     * 目录内带 @Controller 的类会被自动注册进路由。
     *
     * @example
     * Application
     *   .scan('src/business')
     *   .scan('src/modules', 'src/plugins')
     *   .registry(...).start();
     */
    static scan(...dirs: Array<string | string[]>): typeof Application {
        for (const item of dirs.flat()) {
            const abs = path.isAbsolute(item)
                ? path.normalize(item)
                : path.normalize(path.resolve(process.cwd(), item));
            if (!this.scanRoots.includes(abs)) {
                this.scanRoots.push(abs);
            }
        }
        return this;
    }

    static static(url: string | string[]) {
        if (Array.isArray(url)) {
            for (const item of url) {
                app.use(item, express.static(path.resolve(process.cwd(), item)));
            }
        } else {
            app.use(url, express.static(path.resolve(process.cwd(), url)));
        }
        return this;
    }

    /** 当前扫描根目录（只读） */
    static getScanRoots(): string[] {
        return [...this.scanRoots];
    }

    /**
     * 启动服务：
     * 自动 loadControllers → routes → listen
     * 使用者通常只需 registry(...).start()
     */
    static start() {
        if (!this.controllersLoaded) {
            this.loadControllers();
        }
        this.routes();
        applicationStart();
        return this;
    }

    static registry(param: any) {
        const list = Array.isArray(param) ? param : [param];
        for (const item of list) {
            if (isAuthMiddleware(item)) {
                this.authRegistered = true;
            }
            if (isLogMiddleware(item)) {
                this.logRegistered = true;
            }
        }
        Array.isArray(param) ? app.use(...param) : app.use(param);
        return this;
    }

    /** 路由统一挂一次，放在所有中间件之后 */
    static routes() {
        if (!this.routerMounted) {
            app.use(router);
            this.routerMounted = true;
        }
        return this;
    }

    /**
     * 注册装饰器 Controller：读取元数据并挂到现有 GET/POST/...
     * 同一类只会注册一次（@Controller 触发 + 扫描 require 安全）。
     */
    static registerController(Ctor: new () => object) {
        if (this.registeredControllers.has(Ctor)) {
            return this;
        }
        this.registeredControllers.add(Ctor);

        const prefix = getControllerPrefix(Ctor);
        const routes = getControllerRoutes(Ctor);
        // 经 IoC 创建，便于 @Resource(Class) / @Inject(Class) 统一走容器
        const { Container } = require("@/framework/Service") as {
            Container: {
                bindClass: (c: new () => object) => void;
                get: <T>(c: new () => T) => T;
            };
        };
        Container.bindClass(Ctor);
        const instance = Container.get(Ctor);

        for (const route of routes) {
            const fullPath = joinRoutePath(prefix, route.path);
            const method = (instance as Record<string, unknown>)[route.handlerName];
            if (typeof method !== 'function') {
                throw new Error(
                    `[Application] ${Ctor.name}.${route.handlerName} 不是函数`
                );
            }
            const handler = (method as (...args: any[]) => any).bind(instance);
            const option: RouteRuntimeMeta = {
                ...route.option,
                // 透传控制器/方法名，便于操作日志与限流 key
                __controllerName: Ctor.name,
                __handlerName: route.handlerName,
            };
            switch (route.method) {
                case 'GET':
                    this.GET(fullPath, handler, option);
                    break;
                case 'POST':
                    this.POST(fullPath, handler, option);
                    break;
                case 'PUT':
                    this.PUT(fullPath, handler, option);
                    break;
                case 'DELETE':
                    this.DELETE(fullPath, handler, option);
                    break;
            }
        }
        return this;
    }

    /**
     * 扫描并加载模块文件。
     * - 未 scan 时默认：src/business
     * - 可 Application.scan('src/modules') 自定义多个根目录
     * - 优先按 entity → mapper → service → controller → advice 顺序加载，
     *   再递归加载根下其余文件（兼容自定义目录结构）。
     * - 凡被 @Controller 标记的类，加载时自动注入路由。
     *
     * @param dir 仅加载该目录（绝对或相对 cwd）
     */
    static loadControllers(dir?: string) {
        if (this.controllersLoaded && !dir) {
            return this;
        }
        if (dir) {
            const abs = path.isAbsolute(dir)
                ? path.normalize(dir)
                : path.normalize(path.resolve(process.cwd(), dir));
            this.loadScanRoot(abs);
            return this;
        }

        const roots =
            this.scanRoots.length > 0
                ? [...this.scanRoots]
                : [path.resolve(__dirname, "../../business")];

        for (const root of roots) {
            this.loadScanRoot(root);
        }
        this.controllersLoaded = true;
        return this;
    }

    /** 加载单个扫描根：分层目录优先，再兜底全量递归 */
    private static loadScanRoot(root: string) {
        if (!fs.existsSync(root)) {
            log.warn(`扫描目录不存在: ${root}`);
            return;
        }

        // IOC / 依赖友好顺序（存在才加载）
        const phases = [
            "entity",
            "mapper",
            "service",
            "controller",
            "controllers",
            "advice",
            "modules",
        ];
        for (const phase of phases) {
            const dir = path.join(root, phase);
            if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
                this.loadModuleFiles(dir);
            }
        }
        // 兜底：根下其余文件（自定义扁平结构、其它子目录）
        this.loadModuleFiles(root);
    }

    private static loadModuleFiles(dir: string) {
        if (!fs.existsSync(dir)) {
            return;
        }
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                this.loadModuleFiles(full);
                continue;
            }
            // 跳过类型声明与 source map
            if (
                !/\.(ts|js|mts|cts|cjs|mjs)$/.test(entry.name) ||
                entry.name.endsWith(".d.ts") ||
                entry.name.endsWith(".map")
            ) {
                continue;
            }
            const resolved = path.normalize(full);
            if (this.loadedFiles.has(resolved)) {
                continue;
            }
            this.loadedFiles.add(resolved);
            require(resolved);
        }
    }

    /**
     * 路由鉴权优先级：
     * 1. 未注册 Auth → 直接放行（最高）
     * 2. Auth 全局 ignore → 放行
     * 3. 接口 option.auth.ignore → 放行
     * 4. 校验登录
     * 5. 角色 / 权限按 mode 校验（默认 OR，可在装饰器或 Auth.checkMode 覆盖）
     *    - 只配一类：按该类的 mode
     *    - 两类都是 OR：角色或权限命中任一即过
     *    - 其它：两类都要通过（各类内部仍按自己的 mode）
     */
    private static async applyRouteAuth(option: RouteOption = {}, req: Request) {
        if (!this.hasAuth()) {
            return;
        }
        if (isGloballyIgnored(req.path)) {
            return;
        }
        if (option.auth?.ignore) {
            return;
        }
        await AuthUtil.checkLogin();

        const roles = option.auth?.roles ?? [];
        const permissions = option.auth?.permissions ?? [];
        if (roles.length === 0 && permissions.length === 0) {
            return;
        }

        const fallback = getAuthOptions().checkMode ?? "OR";
        const roleMode = option.auth?.roleMode ?? fallback;
        const permissionMode = option.auth?.permissionMode ?? fallback;

        const roleHit = await this.matchAuthList(
            roles,
            roleMode,
            (item) => AuthUtil.hasRole(item)
        );
        const permissionHit = await this.matchAuthList(
            permissions,
            permissionMode,
            (item) => AuthUtil.hasPermission(item)
        );

        const bothOr =
            roles.length > 0 &&
            permissions.length > 0 &&
            roleMode === "OR" &&
            permissionMode === "OR";
        if (bothOr) {
            if (roleHit.ok || permissionHit.ok) return;
            await AuthUtil.checkRole(roleHit.missing ?? roles[0]);
            return;
        }

        if (roles.length > 0 && !roleHit.ok) {
            await AuthUtil.checkRole(roleHit.missing ?? roles[0]);
        }
        if (permissions.length > 0 && !permissionHit.ok) {
            await AuthUtil.checkPermission(permissionHit.missing ?? permissions[0]);
        }
    }

    /** 空列表视为未配置（ok=true 且 empty）。OR 命中任一；AND 必须全部命中。 */
    private static async matchAuthList(
        list: string[],
        mode: "OR" | "AND",
        has: (item: string) => Promise<boolean>
    ): Promise<{ ok: boolean; missing?: string }> {
        if (list.length === 0) return { ok: true };
        if (mode === "AND") {
            for (const item of list) {
                if (!(await has(item))) return { ok: false, missing: item };
            }
            return { ok: true };
        }
        for (const item of list) {
            if (await has(item)) return { ok: true };
        }
        return { ok: false, missing: list[0] };
    }

    /**
     * 路由响应发送后异步写操作日志：
     * - 不 await，不阻塞主业务与 HTTP 响应
     * - setImmediate 再丢到下一事件循环，进一步与请求链路解耦
     * - 写入失败只打日志，不影响已返回的业务结果
     */
    private static scheduleOperationLog(
        req: Request,
        option: RouteOption | undefined,
        payload: {
            result?: unknown;
            error?: unknown;
            startTime: number;
        }
    ) {
        if (!option?.log || !this.hasLog()) return;
        const meta = option as RouteRuntimeMeta;
        const logOption = option.log;
        // 必须在请求结束前同步取 IP：setImmediate 后 socket 可能已释放
        const clientIp = getClientIp(req);
        const userAgent = String(req.headers["user-agent"] || "");
        const ctx = {
            req,
            option: logOption,
            result: payload.result,
            error: payload.error,
            statusCode: resolveLogStatus(payload.error),
            startTime: payload.startTime,
            controllerName: meta.__controllerName,
            clientIp,
            userAgent,
        };
        setImmediate(() => {
            void recordOperationLog(ctx);
        });
    }

    /** 限流 + 防重复提交（在鉴权之后、业务之前） */
    private static async applyRouteGuards(
        option: RouteOption | undefined,
        req: Request
    ) {
        const meta = option as RouteRuntimeMeta | undefined;
        await applyRateLimit(option?.rateLimit, req, {
            controllerName: meta?.__controllerName,
            handlerName: meta?.__handlerName,
        });
        await applyRepeatSubmit(option?.repeatSubmit, req);
    }

    /** SSE 默认头：Content-Type / 禁缓存 / 长连接 / 关 nginx 缓冲 */
    private static prepareFluxResponse(req: Request, response: express.Response) {
        response.status(200);
        response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("X-Accel-Buffering", "no");
        if (typeof response.flushHeaders === "function") {
            response.flushHeaders();
        }
        req.socket?.setTimeout?.(0);
        req.socket?.setNoDelay?.(true);
    }

    private static mountRoute(
        method: 'get' | 'post' | 'put' | 'delete',
        path: string,
        callback: (...args: any[]) => any,
        option?: RouteOption
    ) {
        router[method](path, async (req, response) => {
            const startTime = Date.now();
            let result: unknown;
            let error: unknown;
            try {
                await this.applyRouteAuth(option, req);
                await this.applyRouteGuards(option, req);
                if (option?.flux || option?.raw) {
                    if (option?.flux) {
                        this.prepareFluxResponse(req, response);
                    }
                    const args = resolveRawCallbackArgs(
                        req,
                        response,
                        option,
                        callback.length
                    );
                    if (option?.validate) {
                        await validateMethodArgs(args, option.paramTypes ?? []);
                    }
                    await callback(...args);
                } else {
                    const args = resolveCallbackArgs(req, option, callback.length);
                    if (option?.validate) {
                        await validateMethodArgs(args, option.paramTypes ?? []);
                    }
                    result = await callback(...args);
                    const serialized = ObjectMapper.writeValue(result);
                    response.send(ResponseData.success(serialized));
                }
            } catch (e) {
                error = e;
                await handleException(req, response, e);
            } finally {
                this.scheduleOperationLog(req, option, {
                    result: error ? undefined : result,
                    error,
                    startTime,
                });
            }
        });
        return this;
    }

    static GET<T>(path: string, callback: (...args: any[]) => T | Promise<T>, option?: RouteOption) {
        return this.mountRoute('get', path, callback, option);
    }

    static POST<T>(path: string, callback: (...args: any[]) => T | Promise<T>, option?: RouteOption) {
        return this.mountRoute('post', path, callback, option);
    }

    static PUT<T>(path: string, callback: (...args: any[]) => T | Promise<T>, option?: RouteOption) {
        return this.mountRoute('put', path, callback, option);
    }

    static DELETE<T>(path: string, callback: (...args: any[]) => T | Promise<T>, option?: RouteOption) {
        return this.mountRoute('delete', path, callback, option);
    }
}

export default Application;
export { ParamType };
export type { RouteOption };
export {
    Controller,
    GetMapping,
    PostMapping,
    PutMapping,
    DeleteMapping,
    AuthCheckLogin,
    AuthCheckRole,
    AuthCheckPermission,
    AuthIgnore,
    Log,
    Flux,
    RequestBody,
    RequestQuery,
    RequestPath,
    RequestHeader,
    RequestCookie,
} from "./decorators";
export { BusinessType, OperType } from "@/framework/Log";
export {
    RateLimiter,
    RepeatSubmit,
    RateLimiterType,
} from "@/framework/Redis";
export { Transactional } from "@/framework/ORM";
export { getLogger, logger, configureLogger } from "@/framework/Logger";
export {
    JsonFormat,
    JsonInclude,
    JsonIncludeType,
    JsonProperty,
    ObjectMapper,
    convert,
    copyProperties,
    pick,
} from "@/framework/Json";
export {
    ControllerAdvice,
    ExceptionHandler,
    BizException,
    registerHandler,
} from "@/framework/Exception";
export {
    Validate,
    NotNull,
    Min,
    Max,
    Email,
    Phone,
    Custom,
    validateHandler,
    ValidationError,
} from "@/framework/Validate";
