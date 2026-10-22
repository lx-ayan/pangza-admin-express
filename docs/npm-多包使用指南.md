# Pangza 多包发布后怎么用

> 本文描述**若将 `src/framework` 拆成多个 npm 包**后，下游项目如何安装与使用。  
> 包名以 `@pangza/*` 为例，正式发布时可改 scope。  
>
> **当前进度（P0）**：已支持单包 `@pangza/express`。  
> 根目录执行 `npm run build:lib` → 产物在 `packages/pangza-express`。  
> 快速上手见 [快速开始-单包.md](./快速开始-单包.md)。多包拆分仍为后续目标。

---

## 1. 包一览

| npm 包 | 对应源码 | 作用 | 是否必装 |
|--------|----------|------|----------|
| `@pangza/core` | Service / Container / Json / Exception / Validate / Logger / utils | IoC、校验、JSON、异常、工具 | 是（多数能力依赖） |
| `@pangza/application` | Application | Express 装饰器、扫描 Controller、中间件链 | HTTP 服务必装 |
| `@pangza/orm` | ORM | Db / BaseMapper / QueryWrapper / 多数据源 | 要访问数据库时 |
| `@pangza/auth` | Auth | 登录态、角色权限装饰器 | 要鉴权时 |
| `@pangza/redis` | Redis | Redis 客户端、限流/防重等 | 用 Redis / Auth 存 token 时 |
| `@pangza/log` | Log | 操作日志装饰器与落库钩子 | 要操作审计时 |
| `@pangza/schedule` | schedule | 定时任务 | 要 cron 时 |
| `@pangza/encrypt` | encrypt | AES 等传输加密 | 可选 |
| `@pangza/express` | 聚合 re-export | 一键导入全部公开 API（等同现在的 `@/framework`） | **推荐新手只装这个** |

依赖关系（简化）：

```text
@pangza/express          ← 聚合包（可选，省事）
    ├── application
    ├── orm
    ├── auth
    ├── redis
    ├── log
    ├── schedule
    ├── encrypt
    └── core

application → core
orm         → core
auth        → core（常用 redis 作存储）
log         → core
```

**给用户的推荐：**

- 做完整后台：只装 `@pangza/express` + 驱动 peer（见下）。
- 只要 ORM：装 `@pangza/orm` + `@pangza/core` + `mysql2` / `pg` / `mssql`。
- 只要 HTTP 装饰器、自管数据层：装 `@pangza/application` + `@pangza/core`。

---

## 2. 安装

### 2.1 一条命令（推荐）

```bash
npm i @pangza/express express reflect-metadata inversify
# 按需选数据库驱动（peer，不会被强制装全套）
npm i mysql2
# npm i pg
# npm i mssql
# 鉴权 / 限流常用
npm i redis
```

`tsconfig.json` 需开启装饰器：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "esModuleInterop": true
  }
}
```

入口文件**最上方**：

```ts
import "reflect-metadata";
```

### 2.2 按模块精简安装

```bash
# 最小 HTTP API
npm i @pangza/application @pangza/core express reflect-metadata inversify

# + 数据库
npm i @pangza/orm mysql2

# + 登录鉴权
npm i @pangza/auth @pangza/redis redis
```

---

## 3. 五分钟起步（聚合包）

```ts
// src/main.ts
import "reflect-metadata";
import {
  Application,
  Controller,
  GetMapping,
  PostMapping,
  RequestBody,
  Resource,
  Service,
  Mapper,
  MapperType,
  TableName,
  TableId,
  TableField,
  QueryWrapper,
  Auth,
  Logger,
  Db,
} from "@pangza/express";
import cors from "cors";
import { json } from "express";
import Redis from "@pangza/redis"; // 或从 @pangza/express 导出

@TableName("demo_user")
class UserEntity {
  @TableId()
  id!: string;

  @TableField()
  username!: string;
}

@Mapper(UserEntity)
class UserMapper extends MapperType {}

@Service(UserMapper)
class UserService {
  async list() {
    return this.selectList(new QueryWrapper().orderByDesc("id"));
  }
}
// BaseService 混入后可用 selectList；或 @Resource(UserMapper) 自行调用

@Controller("/api/demo")
class DemoController {
  @Resource(UserService)
  userService!: UserService;

  @GetMapping("/users")
  users() {
    return this.userService.list();
  }

  @PostMapping("/echo")
  echo(@RequestBody() body: { msg?: string }) {
    return { msg: body?.msg ?? "ok" };
  }
}

Application.registry(Logger({ level: "info" }))
  .registry(cors())
  .registry(json())
  .registry(
    Auth({
      ignore: ["/api/demo/**"],
      redis: Redis,
    })
  )
  .scan("src") // 扫描本项目业务目录
  .start();
```

环境变量（与现框架一致，示例）：

```env
PORT=5270
DB_TYPE=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=demo
ORM_LOGIC_DELETE=true
ORM_ID_TYPE=ASSIGN_ID
ORM_MAP_UNDERSCORE_TO_CAMEL=true
```

---

## 4. 按包 import 怎么写

聚合包与分包装的是同一套类，只是入口不同。

```ts
// 写法 A：聚合（文档、示例默认用这个）
import { Controller, GetMapping, Db, Auth } from "@pangza/express";

// 写法 B：分包（减小依赖面时）
import { Controller, GetMapping } from "@pangza/application";
import { Db, QueryWrapper, BaseMapper } from "@pangza/orm";
import Auth from "@pangza/auth";
import { Container, Component, Resource } from "@pangza/core";
```

**不要**在同一项目里混用两套重复绑定的容器实例；选一种导入风格即可。聚合包内部应 re-export 同一份实现。

---

## 5. 常见场景对照

### 5.1 只要 Mapper CRUD

```bash
npm i @pangza/orm @pangza/core mysql2 reflect-metadata
```

```ts
import "reflect-metadata";
import { table, QueryWrapper, configureOrm } from "@pangza/orm";

configureOrm({ sqlLog: true });

const user = table("user");
const rows = await user.selectList(new QueryWrapper().eq("status", 1));
```

不装 Application 也能跑脚本 / Worker。

### 5.2 多数据源

```ts
import { Db } from "@pangza/orm";

Db.register("pg", {
  type: "postgresql",
  host: "127.0.0.1",
  database: "app",
  user: "postgres",
  password: "x",
});

await Db.queryOn("pg", 'SELECT 1');
// @Mapper(Entity, { datasource: "pg" })
// @Select("...", { db: "postgresql" })
```

### 5.3 自定义填充（MetaObjectHandler）

```ts
import { setMetaObjectHandler } from "@pangza/orm";

setMetaObjectHandler({
  insert(row) {
    // 全局 create_time 等已由 ORM_FILL_* 处理；这里放业务扩展
  },
  update(row) {},
});
```

### 5.4 操作日志落库

```ts
import { configureLog } from "@pangza/log";
import { Container } from "@pangza/core";

configureLog({
  writer: async (row) => {
    await Container.get(SysLogService).insert(row as any);
  },
});
```

---

## 6. peerDependencies 说明（用户侧）

发布时应把「运行时几乎总要有、但版本由用户定」的库列为 peer：

| peer | 谁需要 |
|------|--------|
| `express` | application |
| `reflect-metadata` | 全系装饰器 |
| `inversify` | core IoC |
| `mysql2` / `pg` / `mssql` | orm（按 DB_TYPE 选装） |
| `redis` | redis / auth 会话 |
| `jsonwebtoken` | auth 的 jwt 模式 |
| `pino` | logger |

用户漏装 peer 时，npm 7+ 会警告；文档里写清「最小安装命令」即可。

---

## 7. 与「单包发布」的差异（给作者）

| | 单包 `@pangza/express` only | 多包 + 聚合包 |
|--|------------------------------|---------------|
| 用户安装 | 一条 `npm i` | 新手仍一条；进阶可减依赖 |
| 维护成本 | 低 | 要管版本、workspace、breaking change |
| 适用 | 先验证市场 | 模块边界稳定后再拆 |

建议：**对外文档始终以 `@pangza/express` 为主入口**；分包章节放在「进阶 / 按需安装」。

---

## 8. 版本策略（建议）

- 聚合包 `@pangza/express` 版本与核心能力对齐（如 `1.2.0`）。
- 子包可用相同 major；`express@1.2.0` 依赖 `@pangza/orm@^1.2.0`。
- Breaking change 统一升 major，避免「装了 express 1.x 却拉到 orm 2.x」。

---

## 9. 用户项目目录建议

```text
my-app/
  package.json          # 依赖 @pangza/express + mysql2 + redis ...
  .env
  src/
    main.ts             # Application.registry(...).scan("src").start()
    entity/
    mapper/
    service/
    controller/
```

业务代码**不要**再复制一份 framework；只写 entity / mapper / service / controller。

---

## 10. FAQ

**Q: 必须 monorepo 才能多包吗？**  
A: 发布形态是多包；源码可以用 pnpm workspace / turborepo 管理，也可以多个仓库。对用户只体现为多个 `@pangza/*`。

**Q: 升级后 import 路径会变吗？**  
A: 保证 `@pangza/express` 的导出与现 `framework/index.ts` 对齐，老用户只改 import 前缀即可。

**Q: 示例业务怎么发？**  
A: 用仓库根目录的 `create-pangza init`（空模板 + 可选模块），或 GitHub `examples/starter`；不要打进 framework 的 npm tarball。

---

## 相关文档

- 装饰器与开发约定：`docs/二阶段.md`、`docs/README.md`
- 多数据源 / IdType / @Bean：`docs/三阶段.md`
