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
import Logger from "./framework/Logger";
import { configureOrm } from "./framework/ORM";
import Redis from "./framework/Redis";

// 最先配置 pino，后续 getLogger 才绑到同一实例
Application.registry(Logger({ level: "info" }));

// SQL 日志：也可在 .env 设 ORM_SQL_LOG=true
configureOrm({
  sqlLog: true,
});

const app = Application.getApp();
app.use(UPLOAD_URL_PREFIX, express.static(UPLOAD_PATH));

Application.registry(cors())
  .registry(json())
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
        "/api/pub/**",
      ],
      redis: Redis,
    })
  )
  .registry(Log())
  // 默认扫描 src/business（示例业务，可整包删除）
  // 额外模块：.scan("src/business", "src/modules")
  .start();
