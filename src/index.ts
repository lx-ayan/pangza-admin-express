import { json } from "express";
import "@/config"; // 优先加载 .env
import Application from "./core/Application";
import cors from "cors";
import Auth, { AuthUtil } from "./core/Auth";
import Redis from "./core/Redis";

// 启动应用并注册全局中间件：cors -> json -> Auth -> 路由
Application.start()
  .registry(cors())
  .registry(json())
  .registry(
    Auth({
      // 登录接口不强制鉴权
      ignore: ["/auth/login"],
      // 会话 2 小时
      timeout: 2 * 60 * 60 * 1000,
      // 传入 Redis 后会话优先走 Redis
      redis: Redis,
    })
  )
  .routes();

/** 登录：成功后返回 token（演示账号 admin / 123456） */
Application.GET("/auth/login", async (req) => {
  const { username, password } = req.query ?? {};
  if (username !== "admin" || password !== "123456") {
    throw new Error("用户名或密码错误");
  }
  const token = await AuthUtil.login(1, ["admin"], ["user:list", "user:add"]);
  return { token };
});

/** 注销当前 token */
Application.GET("/auth/logout", async () => {
  await AuthUtil.checkLogin();
  await AuthUtil.logout();
  return true;
});

/** 当前登录用户信息 */
Application.GET("/auth/me", async () => {
  const loginId = await AuthUtil.checkLogin();
  return {
    loginId,
    roles: await AuthUtil.getRoleList(),
    permissions: await AuthUtil.getPermissionList(),
  };
});

/** 公开接口示例（未调用 checkLogin，可不带 token） */
Application.GET<string>("/api", () => {
  return "hello world";
});

/** 需要权限 user:list 的接口示例 */
Application.GET<{ username: string }[]>("/user/list", async () => {
  return [{ username: "admin" }, { username: "user" }];
}, {
  auth: { permissions: ["user:list"] },
});
