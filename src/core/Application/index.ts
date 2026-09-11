import express, { Express, Router } from 'express';
import { PORT } from '@/config';
import ResponseData from '@/utils/entity/ResponseData';
import { AUTH_MIDDLEWARE_FLAG, AuthError, AuthUtil } from '@/core/Auth';

let __isStart = false;

const app: Express = express();

const router = Router();

export function applicationStart() {
    return app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
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

/** 统一处理路由异常：鉴权错误返回业务码，其它走 500 */
function sendHandlerError(response: express.Response, error: unknown) {
    if (error instanceof AuthError) {
        response.status(200).send(ResponseData.error(error.message, null, error.code));
        return;
    }
    const message = error instanceof Error ? error.message : '错误';
    response.status(500).send(ResponseData.error(message));
}

/** 路由级鉴权配置 */
interface RouteOption {
    auth?: {
        /** 需要的权限（需已注册 Auth） */
        permissions?: string[];
        /** 需要的角色（需已注册 Auth） */
        roles?: string[];
        /** 为 true 时跳过登录校验 */
        ignore?: boolean;
    };
}

/** 判断中间件是否为 Auth 模块 */
function isAuthMiddleware(param: unknown): boolean {
    return typeof param === 'function' && !!(param as any)[AUTH_MIDDLEWARE_FLAG];
}

class Application {
    private static routerMounted = false;
    /** 是否已通过 registry 注册 Auth 中间件 */
    private static authRegistered = false;

    static getApp() {
        return app;
    }

    /** 是否已注册 Auth 模块 */
    static hasAuth() {
        return this.authRegistered;
    }

    static start() {
        applicationStart();
        return this;
    }

    static registry(param: any) {
        const list = Array.isArray(param) ? param : [param];
        for (const item of list) {
            if (isAuthMiddleware(item)) {
                this.authRegistered = true;
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
     * 若已注册 Auth 且路由配置了 auth，则按 option 做登录/角色/权限校验
     */
    private static async applyRouteAuth(option?: RouteOption) {
        if (!this.hasAuth() || !option?.auth || option.auth.ignore) {
            return;
        }
        await AuthUtil.checkLogin();
        for (const role of option.auth.roles ?? []) {
            await AuthUtil.checkRole(role);
        }
        for (const permission of option.auth.permissions ?? []) {
            await AuthUtil.checkPermission(permission);
        }
    }

    static GET<T>(path: string, callback: (...args: any[]) => T | Promise<T>, option?: RouteOption) {
        router.get(path, async (req, response) => {
            try {
                await this.applyRouteAuth(option);
                const result = await callback(req, response);
                response.send(ResponseData.success(result));
            } catch (error) {
                sendHandlerError(response, error);
            }
        });
        return this;
    }

    static POST<T>(path: string, callback: (...args: any[]) => T | Promise<T>, option?: RouteOption) {
        router.post(path, async (req, response) => {
            try {
                await this.applyRouteAuth(option);
                const result = await callback(req, response);
                response.send(ResponseData.success(result));
            } catch (error) {
                sendHandlerError(response, error);
            }
        });
        return this;
    }

    static PUT<T>(path: string, callback: (...args: any[]) => T | Promise<T>, option?: RouteOption) {
        router.put(path, async (req, response) => {
            try {
                await this.applyRouteAuth(option);
                const result = await callback(req, response);
                response.send(ResponseData.success(result));
            } catch (error) {
                sendHandlerError(response, error);
            }
        });
        return this;
    }

    static DELETE<T>(path: string, callback: (...args: any[]) => T | Promise<T>, option?: RouteOption) {
        router.delete(path, async (req, response) => {
            try {
                await this.applyRouteAuth(option);
                const result = await callback(req, response);
                response.send(ResponseData.success(result));
            } catch (error) {
                sendHandlerError(response, error);
            }
        });
        return this;
    }
}

export default Application;
