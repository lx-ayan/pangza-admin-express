# pangza-admin-express

装饰器驱动的 Express 后台框架：TypeScript + IoC + ORM + 鉴权，面向管理端 API，写法接近 Spring Boot。

提供 `@Controller` / `@Mapper` / `@Service`、参数注入、会话鉴权、DTO 校验、全局异常、操作日志、限流防重、Redis、定时任务等，可与配套 Vue 管理端一起使用。

## 文档

完整说明（快速开始、核心模块、业务 API、配置等）见：

**https://pangza-express-admin.pages.dev/**

## 本地运行

```bash
npm install
cp .env.example .env   # 配置 MySQL / Redis 等
npm run dev
```

```bash
npm run build && npm start
npm test
```

## 仓库

https://github.com/lx-ayan/pangza-admin-express
