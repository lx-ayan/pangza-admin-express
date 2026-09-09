import express, { Express, json, RequestHandler, Router, response } from 'express';
import { PORT } from '@/config';
import ResponseData from '@/utils/entity/ResponseData';

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

class Application {
    static getApp() {
        return app;
    }

    static start() {
        applicationStart();
        return this;
    }

    static registry(param: any) {
        Array.isArray(param) ? app.use(...param) : app.use(param);
        app.use(router);
        return this;
    }
    
    static GET<T>(path: string, callback: (...args: any[]) => T | Promise<T>) {
        router.get(path, async (req, response) => {
            try {
                const result = await callback(req, response);
                response.send(ResponseData.success(result));
            } catch (error) {
                response.status(500).send(ResponseData.error('错误'));
            }
        });
    }

    static POST<T>(path: string, callback: RequestHandler<T>) {
        router.post(path, callback);
    }
}

export default Application;