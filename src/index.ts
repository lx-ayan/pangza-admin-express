import "reflect-metadata";
import { ensureUtf8Console } from "./framework/Logger";

// Windows 控制台尽早切 UTF-8，避免中文日志乱码
ensureUtf8Console();

import express, { json } from "express";
import "@/framework/config";
import { UPLOAD_PATH, UPLOAD_URL_PREFIX } from "@/framework/config";
import Application from "./framework/Application";
import cors from "cors";
import Auth from "./framework/Auth";
import Log from "./framework/Log";
import Logger, { getLogger } from "./framework/Logger";
import { configureOrm } from "./framework/ORM";
import { encryptMiddleware } from "./framework/encrypt/middleware";
import { initScheduleJobs } from "./framework/schedule/ScheduleManager";
import Redis from "./framework/Redis";

// 最先配置 pino，后续 getLogger 才绑到同一实例
Application.registry(Logger({ level: "info" }));

// SQL 日志：也可在 .env 设 ORM_SQL_LOG=true
configureOrm({
  sqlLog: true,
  // 自定义格式（占位符：{time} {type} {sql} {params} {cost}）
  // sqlLogFormat: "{time} | {type} | {sql} | {params}",
  // 关闭某些片段：
  // sqlLogParts: { time: true, type: true, sql: true, params: false, cost: true },
  // 或函数完全自定义：
  // sqlLogFormat: (info) => `${info.type} ${info.cost}ms => ${info.sql}`,
});

const log = getLogger("bootstrap");

const app = Application.getApp();
app.use(UPLOAD_URL_PREFIX, express.static(UPLOAD_PATH));

Application.registry(cors())
  .registry(json())
  .registry(encryptMiddleware())
  .registry(
    Auth({
      // 对齐 Sa-Token 常用配置
      tokenName: "satoken",
      header: "Authorization",
      tokenPrefix: "",
      // 30 天（毫秒）；-1 永不过期
      timeout: 30 * 24 * 60 * 60 * 1000,
      // 闲置超时：-1 不启用
      activityTimeout: -1,
      // false：新登录挤掉同账号旧登录
      allowConcurrentLogin: false,
      // false：每次登录新建 token
      isShare: false,
      // uuid | simple-uuid | random-32 | random-64 | random-128 | tik | jwt
      tokenStyle: "uuid",
      // tokenStyle: 'jwt' 时需要：
      // jwtSecret: process.env.JWT_SECRET || 'change-me',
      ignore: [
        "/api/user/login",
        "/api/user/check_login",
        "/api/sys_config/public",
        "/api/aes/key",
      ],
      redis: Redis
    })
  )
  .registry(Log())
  // 自定义业务目录（可多目录）；不写则默认扫描 src/business
  // .scan("src/business", "src/modules")
  .start();

void initScheduleJobs().catch((e) => {
  log.error(e, "Schedule 初始化失败");
});
