# Application 装饰器：路由如何被识别、请求如何注入

源码：`Application/decorators.ts`、`metadata.ts`、`index.ts`、`types.ts`

导入：`import { Controller, GetMapping, ..., Flux, RequestBody } from "@/framework/Application"`

先读 [概述.md](./概述.md) 里的「扫描 + @Controller 自动注册」；本文展开每个注解的机制。

---

## 一、路由为何能挂上 Express？

### 1.1 两阶段

| 阶段 | 时机 | 做什么 |
|------|------|--------|
| 收集 | 类定义 / require 时 | `@GetMapping` 往 `routes[]` 写元数据；`@Controller` 调 `registerController` |
| 挂载 | `registerController` 内 | `Application.GET(path, handler, option)` → `router.get(path, async (req,res)=>...)` |

### 1.2 `@Controller(prefix?)`

```ts
export function Controller(prefix = ""): ClassDecorator {
  return (ctor) => {
    setControllerPrefix(Ctor, prefix);                    // 元数据：前缀
    Reflect.defineMetadata(CONTROLLER_TYPE, true, Ctor); // 元数据：这是 Controller
    require("./index").default.registerController(Ctor); // 主动报到 Application
  };
}
```

| 参数 | 默认 | 作用 |
|------|------|------|
| `prefix` | `""` | 与方法 path 拼接，如 `/api/user` + `/list` → `/api/user/list` |

**为何「能识别」：** 不是 Application 去搜带 `@Controller` 的类，而是装饰器执行时**自己调用** `registerController`。扫描只是确保文件被 require。

`registerController` 用 `WeakSet` 去重：装饰器触发一次、扫描再 require 一次，也只会挂一套路由。

### 1.3 `@GetMapping` / `@PostMapping` / `@PutMapping` / `@DeleteMapping`

共用工厂：

```ts
function createHttpDecorator(method: HttpMethod) {
  return (path = "", option?: RouteOption): MethodDecorator => {
    return (target, propertyKey) => {
      addControllerRoute(target.constructor, {
        method, path, handlerName: String(propertyKey), option,
      });
    };
  };
}
```

`addControllerRoute` 不止 push 路径，还会**合并**该方法上已有的：

`auth` / `log` / `rateLimit` / `repeatSubmit` / `validate` / `paramTypes` / `flux` / `params`

所以你可以：

```ts
@GetMapping("/x")           // 只写 path
@Flux()                     // 另写装饰器
async x() {}

// 或
@GetMapping("/x", { flux: true })  // 写在 option 里，等价
```

#### RouteOption 全字段

| 字段 | 含义 |
|------|------|
| `auth.permissions / roles / ignore` | 鉴权 |
| `log` | 操作日志配置 |
| `rateLimit` | 限流 |
| `repeatSubmit` | 防重复提交 |
| `paramType` | 无参数装饰器时的单参注入来源（旧写法） |
| `params` | `@Request*` 元数据列表（一般自动填） |
| `raw` | 不包装 ResponseData，回调 `(req,res)` 或带注入的 raw 规则 |
| `flux` | SSE：raw + 默认 event-stream 头 |
| `validate` | 是否校验入参 |
| `paramTypes` | `design:paramtypes`，给 `@Validate` 用 |

---

## 二、鉴权注解

依赖：`Application.registry(Auth({...}))`，否则 `applyRouteAuth` 直接放行。

### 实现方式

```ts
export function AuthCheckRole(roles: string[]): MethodDecorator {
  return (target, propertyKey) => {
    mergeMethodAuth(ctor, handlerName, { roles });
    // mergeMethodAuth → 写 methodAuth 元数据 + rewriteRouteOption 回写 routes
  };
}
```

请求时 `applyRouteAuth(option, req)`：

1. 未注册 Auth → return  
2. 全局 ignore 路径 → return  
3. `option.auth.ignore`（`@AuthIgnore`）→ return  
4. `AuthUtil.checkLogin()`  
5. 按 **OR / AND** 校验角色、权限（默认 OR，可用 `Auth({ checkMode: "AND" })` 改全局）

| 装饰器 | 参数 | 运行时行为 |
|--------|------|------------|
| `@AuthCheckLogin()` | 无 | 只登录 |
| `@AuthCheckRole(roles, { mode? })` | 角色数组；`mode` 默认全局 | OR：命中任一；AND：全部具备 |
| `@AuthCheckPermission(perms, { mode? })` | 权限数组；同上 | 同上 |
| `@AuthIgnore()` | 无 | 跳过鉴权 |

角色和权限都配了、且两边都是 OR：命中任一角色或权限即可。否则两类都要通过（各类内部仍按自己的 mode）。

```ts
@PostMapping("/remove")
@AuthCheckPermission(["sys:user:add", "sys:user:edit"], { mode: "AND" })
async remove(@RequestBody() body: { id: string }) {}
```

函数式：`{ auth: { permissions: ["a", "b"], permissionMode: "AND" } }`。

---

## 三、`@Log` / `@RateLimiter` / `@RepeatSubmit`

同样是「写元数据 + rewrite 路由 option」，在 `mountRoute` 里消费。

### `@Log(option?)`

| 字段 | 说明 |
|------|------|
| `title` | 标题 |
| `business` | `BusinessType` |
| `oper` | 操作人类型 |
| `excludeParamNames` | 不记入日志的参数名 |
| `ignore` | 跳过 |

依赖 `registry(Log())`。在 `finally` 里 `scheduleOperationLog`（含 IP/耗时/结果）。

### `@RateLimiter(option?)`

| 字段 | 默认 | 说明 |
|------|------|------|
| `time` | 2 | 窗口秒 |
| `count` | 1 | 次数 |
| `type` | DEFAULT | `DEFAULT` / `IP` / `USER` |
| `mode` | fixed | `fixed` 固定窗口；`sliding` 滑动窗口 |
| `key` | — | 自定义 key |

Redis Lua；超限抛 `GuardError`。

**按 IP 限流与 `server.trustProxy`：**

- 默认 `trustProxy: false`：`getClientIp` **忽略** `X-Forwarded-For` 等头，只用直连 socket IP，防止客户端伪造头绕过限流。
- 仅当前面有**可信** Nginx / 网关时，在 `application.yaml` 设 `server.trustProxy: true`，再信任转发头。
- 无反代时勿开 `trustProxy`。

**启动性能：** `npm run dev` 已开 `--transpile-only`；Redis/DB 改为 listen 后再并行预热（不再在 `import` 时连）。生产用 `npm run build && npm start` 会明显更快。

**进程不会因业务报错直接退出：** HTTP 路由有统一 `handleException`；定时任务 / ApplicationInit / 模块加载失败只打日志；并挂了 `unhandledRejection` / `uncaughtException` 兜底。配置缺失、端口占用等**启动硬错误**仍会退出。

**Redis 连接（`application.yaml` → `redis`）：**

- `mode`：`standalone`（默认）/ `cluster` / `sentinel`
- `username`（ACL）、`tls`、`reconnect` 指数退避
- `Redis.ping()` 健康探测；`tryLock` / `withLock`（可续租）；`unlockIfMatch` 勿直接 `del`
- List / ZSet / `pipeline` / `publish`·`subscribe`
- `@Cacheable` / `@CacheEvict` 方法缓存；限流支持 `USER` 与 `mode: sliding`
- **Redisson 风格**：`Redisson.getLock`（可重入+看门狗）、公平锁 / 读写锁 / 联锁、信号量、CountDownLatch、Bucket/Map/… — 见 [Redisson.md](./Redisson.md)

### `@RepeatSubmit(option?)`

| 字段 | 默认 | 说明 |
|------|------|------|
| `interval` | 3000 | ms |
| `message` | — | 提示 |

按「URL + 登录用户 + 参数指纹」用 Redis `SET NX PX` 原子占坑，同参数在间隔内重复提交会拒绝。

执行点：鉴权之后、业务之前 → `applyRouteGuards`。

---

## 四、`@Flux()` 与 `raw`

### 为什么需要？

默认分支会：

```ts
result = await callback(...args);
response.send(ResponseData.success(ObjectMapper.writeValue(result)));
```

SSE / 下载不能走这套，所以 `flux` / `raw` 走另一分支。

### `@Flux()` 做了什么

1. `mergeMethodFlux` → `RouteOption.flux = true`  
2. `prepareFluxResponse`：设置 `text/event-stream`、禁缓存、长连接、`X-Accel-Buffering: no`、`flushHeaders`、socket 超时 0  
3. 用 `resolveRawCallbackArgs` 调业务（支持 `@RequestBody` 等）

```ts
@PostMapping("/stream")
@Flux()
async stream(@RequestBody() body: any, res: Response) {
  res.write(`data: ${JSON.stringify(body)}\n\n`);
  res.end();
}
```

函数式：`{ flux: true }`。

### 参数注入规则（flux/raw）

见 `resolveRawCallbackArgs`：

| 情况 | 行为 |
|------|------|
| 无 `@Request*` | `(req, res)` |
| 有装饰器，1 个未标注形参 | 该形参 = `res` |
| 多个未标注 | 第一个 `req`，其余 `res` |
| 全部已标注 | 参数列表末尾再追加 `res` |

`raw: true`：同样不包装 JSON，但不加 SSE 头。

---

## 五、参数装饰器：如何把 `req.body` 塞进形参？

### 5.1 写入阶段

```ts
export function RequestBody(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    addMethodParam(ctor, handlerName, {
      index: parameterIndex,  // 第几个形参
      source: "body",
    });
  };
}
```

`addMethodParam` 把列表存进 `pangza.controller.methodParams`，并回写到已有 `routes[].option.params`。

TypeScript 调用参数装饰器时会传入**真实下标**，所以框架知道「第 0 个参数要 body」。

### 5.2 读取阶段（普通接口）

```ts
function resolveCallbackArgs(req, option, arity) {
  const metas = option?.params;
  if (metas?.length) {
    const args = new Array(maxIndex + 1).fill(req); // 未标注默认 req
    for (const meta of metas) {
      args[meta.index] = resolveParamInject(req, meta);
    }
    return args;
  }
  return [resolveCallbackArg(req, option)]; // 兼容老 paramType
}
```

```ts
switch (meta.source) {
  case "body": return req.body ?? {};
  case "query": return req.query ?? {};
  case "header": return req.headers ?? {};
  case "cookie": return req.cookies ?? {};
  case "path": // Object.values(req.params)，可 pathIndex
}
```

### 5.3 一览

| 装饰器 | 参数 | 注入 |
|--------|------|------|
| `@RequestBody()` | 无 | `req.body` |
| `@RequestQuery()` | 无 | `req.query` |
| `@RequestPath(i?)` | 可选下标 | path 参数 |
| `@RequestHeader()` | 无 | headers |
| `@RequestCookie()` | 无 | cookies（需中间件） |

```ts
@GetMapping("/:id")
detail(@RequestPath() id: string, @RequestQuery() q: any) {}
```

无任何参数装饰器时：整段传入 `req`（或 `option.paramType` 指定的单一来源）。

---

## 六、`mountRoute` 总览（请求入口）

```ts
router[method](path, async (req, response) => {
  try {
    await applyRouteAuth(option, req);
    await applyRouteGuards(option, req);
    if (option.flux || option.raw) {
      if (option.flux) prepareFluxResponse(req, response);
      await callback(...resolveRawCallbackArgs(...));
    } else {
      const args = resolveCallbackArgs(...);
      if (option.validate) await validateMethodArgs(args, option.paramTypes);
      const result = await callback(...args);
      response.send(ResponseData.success(ObjectMapper.writeValue(result)));
    }
  } catch (e) {
    await handleException(req, response, e);
  } finally {
    scheduleOperationLog(...);
  }
});
```

---

## 七、装饰器与函数式对照

| 装饰器 | RouteOption / API |
|--------|-------------------|
| `@Controller('/api')` | 类前缀 + 自动 register |
| `@GetMapping('/a')` | `Application.GET('/a', fn)` |
| `@AuthIgnore()` | `auth: { ignore: true }` |
| `@AuthCheckRole(['admin'])` | `auth: { roles: ['admin'] }` |
| `@Flux()` | `flux: true` |
| `@Log({ title })` | `log: { title }` |
| `@Validate()` | `validate: true` + paramTypes |

---

## 八、顺序建议（非强制）

```ts
@PostMapping("/create")
@AuthCheckLogin()
@RateLimiter({ time: 10, count: 5 })
@RepeatSubmit()
@Log({ title: "新增" })
@Validate()
async create(@RequestBody() body: Dto) {}
```

Mapping 放最上（离方法最远）可读性更好；机制上任意顺序均可。
