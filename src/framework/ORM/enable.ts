import type { NextFunction, Request, Response } from "express";
import Db from "./Db";
import type { DataSourceConfig } from "./DataSource";
import { ORM_MODULE_FLAG, markOrmEnabled } from "./flag";

/**
 * 显式启用 ORM / 默认数据源：预热仅在 registry 后执行。
 * 未 registry 时启动阶段不会连库；业务首次查询仍可懒连接。
 *
 * @example
 * Application.registry(EnableOrm()).start();
 * Application.registry(EnableOrm({ host: "127.0.0.1", database: "app" })).start();
 */
export function EnableOrm(config?: DataSourceConfig) {
  markOrmEnabled(true);
  if (config) {
    Db.register("default", config);
  }

  const middleware = (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };

  Object.defineProperty(middleware, ORM_MODULE_FLAG, {
    value: true,
    enumerable: false,
  });

  return middleware;
}
