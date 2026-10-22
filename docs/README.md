# 文档目录

## 需求

- [二阶段开发规划](./二阶段.md)
- [三阶段开发规划](./三阶段.md)
- [ORM 开发清单](./ORM开发清单.md)（P0–P2 / R1 / X1-a·b 已完成）
- [ORM 使用约定](./ORM使用约定.md)（列名、事务、批次、关联、XML、迁移）
- [ORM 扩展设计：XML 与关联](./ORM扩展设计-XML与关联.md)（设计稿；R1/X1 已落地部分见清单）

## 装饰器详解（按模块拆分）

推荐阅读顺序：**概述 → Service / ORM → Application → 其余**。

| 文档 | 你会弄懂什么 |
|------|----------------|
| [概述](./decorators/概述.md) | **为什么装饰器能被识别**：执行时机、Reflect 元数据、扫描 require、`@Controller` 主动注册、Container 角色、请求全链路 |
| [Service](./decorators/Service.md) | **Container**；`@Component` / `@Bean` / `@Resource`；**`@Mapper(Entity)`**；`@Service` 委托 |
| [ORM](./decorators/ORM.md) | `@TableName/@TableId(IdType)/@TableField`；多数据源；SQL 注解；`@Select` 水合；`@TableSearch` |
| [Application](./decorators/Application.md) | 路由挂载、鉴权/日志/限流/Flux、**参数装饰器如何按形参下标注入** |
| [Redisson](./decorators/Redisson.md) | 分布式可重入锁/看门狗、公平锁/读写锁/联锁、信号量、Bucket/Map 等 |
| [Json](./decorators/Json.md) | ObjectMapper 与 Format/Include/Property；plain object 为何也能格式化 |
| [Validate](./decorators/Validate.md) | 规则挂在 DTO 上；`@Validate` + `design:paramtypes` 如何对上 Body 类型 |
| [Exception](./decorators/Exception.md) | Advice 如何注册；抛错后如何匹配 Handler |

```ts
// 常用导入
import {
  Controller, GetMapping, PostMapping, Flux,
  AuthCheckLogin, RequestBody, Log,
} from "@/framework/Application";
import { Service, Resource, Mapper, Component, Bean } from "@/framework/Service";
import { TableName, TableId, TableField, Select, Param, TableSearch, OperTypeEnum, getQueryWrapperAndPage, IdType } from "@/framework/ORM";
import { JsonFormat, JsonInclude, convert } from "@/framework/Json";
import { Validate, NotNull, Min } from "@/framework/Validate";
import { ControllerAdvice, ExceptionHandler } from "@/framework/Exception";
```
