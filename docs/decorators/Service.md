# Service / IOC：Container、@Component、@Resource、@Mapper、@Service

源码：

- `src/framework/Service/container.ts` — **Inversify** 门面（按类注入）
- `src/framework/Service/decorators.ts` — 四个装饰器
- `src/framework/Service/types.ts` — 委托方法列表
- `src/framework/ORM/table.ts` — `table()` → `BaseMapper`
- `src/framework/ORM/entityDecorators.ts` — `getEntityTableMeta`

---

## 一、Container 是什么？做什么？

### 1.1 一句话

底层使用 **Inversify**；对外仍导出 `Container`。  
**主 Token 是类本身**（`UserService`），不再用 `"UserService"` 字符串做业务注入。  
仅定时任务等场景保留**可选字符串别名**（如 `@Component("sysLogCleanTask")`）。

### 1.2 门面 API

```ts
Container.bindClass(UserService);           // 按类绑单例
Container.bindAlias("sysLogTask", SysLogTask); // 可选别名 → 同一实例
Container.has(UserService);                 // / has("sysLogTask")
Container.get(UserService);                 // 取出单例
```

内部会对类 `decorate(injectable(), ctor)`，再 `bind(ctor).toSelf().inSingletonScope()`。

### 1.3 和 Spring 的对应关系

| Spring | 本框架 |
|--------|--------|
| `@Component` / `@Service` 扫包注册 Bean | `@Component` / `@Mapper` / `@Service` → `bindClass(类)` |
| `@Autowired` 按类型 | `@Resource(UserService)` → `Container.get(UserService)` |
| 单例作用域 | Inversify `inSingletonScope` / `defaultScope: Singleton` |
| 按名查找 Bean（少见） | `@Component("alias")` + `Container.get("alias")`（调度用） |

### 1.4 生命周期时间线

```
1. require("UserMapper.ts")
   → @Mapper → Container.bindClass(UserMapper)

2. require("UserService.ts")
   → @Service → Container.bindClass(UserService)
   → 原型上挂 selectById / insert ...

3. require("UserController.ts")
   → @Controller → Container.bindClass(UserController)
   → Container.get(UserController) 得到单例实例并挂路由
   → @Resource(UserService) 是原型 getter，首次访问才 get

4. 第一次请求 this.userService
   → getter → Container.get(UserService)
   → Inversify 创建并缓存 UserService 单例
```

**没有第 1、2 步的 bindClass，第 4 步会抛「未找到组件」。**  
扫描顺序 `mapper → service → controller` 仍然重要。

---

## 二、`@Component(name?)`

### 做什么

把类 `bindClass` 进容器。可选 `name` 再挂字符串别名（调度任务 DB 里存的 beanName）。

### 参数

| 参数 | 默认 | 说明 |
|------|------|------|
| `name?` | — | 可选别名；业务注入请用类，不要依赖别名 |

### 用法

```ts
@Component()
class FileService {}

@Component("sysLogCleanTask") // 类 + 调度别名
export class SysLogCleanTask {
  execute() {}
}
```

---

## 三、`@Resource(Type)`

### 做什么

**按类属性注入**：`this.xxx` → `Container.get(Type)`。

### 参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `type` | 是 | 类构造函数，如 `UserService`、`UserRoleMapper` |

### 用法

```ts
@Resource(UserService)
private userService!: UserService;

@Resource(UserRoleMapper)
userRoleMapper!: UserRoleMapper;

// ❌ 旧写法已废弃
// @Resource("UserService")
```

### 常见坑

```ts
@Resource(UserService)   // 必须是值导入，不能 import type
private userService!: UserService;

Container.get(UserService); // 函数式取 Bean 同样传类
```

### 构造器注入（可选）

也可使用 Inversify 原生风格（类须由容器创建，Controller 已走 `Container.get`）：

```ts
import { Inject, Service } from "@/framework/Service";

@Service(UserMapper)
class UserService {
  constructor(@Inject(UserRoleMapper) private userRoleMapper: UserRoleMapper) {}
}
```

属性 `@Resource(Class)` 仍是 Controller / Service 上更常见的写法。

---

## 四、`@Mapper(tableOrEntity, idFieldOrOptions?)`（重点）

### 4.1 做什么（三件事）

1. **解析表名与 ORM 选项**（字符串表名，或从 Entity 读 `@TableName`）
2. **往 Mapper 类原型混入 BaseMapper 的 CRUD 方法**（你不用手写 `selectById`）
3. **按「类」`bindClass(UserMapper)` 进 Inversify 容器**

### 4.2 参数详解

| 参数 | 类型 | 说明 |
|------|------|------|
| 第 1 参 | `string \| EntityCtor` | 表名，**或** 带 `@TableName` 的实体类 |
| 第 2 参 | `string \| MapperTableOptions` | 主键字段名，或配置对象；默认 `"id"` |

`MapperTableOptions` 常见字段：

| 字段 | 说明 |
|------|------|
| `idField` | 主键属性名 |
| `logicDelete` | 是否启用逻辑删除 |
| `logicDeleteField` / `logicDeleteValue` / `logicNotDeleteValue` | 逻辑删字段与值 |
| `optimisticLock` / `versionField` | 乐观锁 |
| `entity` | 一般由框架在传 Entity 时自动填入 |

### 4.3 为什么传 Entity 就「知道」表？——逐步拆开

#### 步骤 A：实体类先被加载，装饰器写元数据

```ts
@TableName("sys_user")
export class User {
  @TableId("user_id")
  id!: string;

  @TableField("user_name")
  username!: string;
}
```

执行时：

```ts
Reflect.defineMetadata(TABLE_NAME_KEY, "sys_user", User);
// fields map: id → { column: "user_id", id: true }, username → { column: "user_name" }
```

`getEntityTableMeta(User)` 返回：

```ts
{
  tableName: "sys_user",
  idColumn: "user_id",
  fields: [ ... ]
}
```

#### 步骤 B：`@Mapper(User)` 收到的是「类」，不是实例

```ts
@Mapper(User, { logicDelete: true })
class UserMapper {}
```

`User` 在运行时是构造函数对象。装饰器调用：

```ts
resolveMapperBinding(User, { logicDelete: true })
```

#### 步骤 C：`resolveMapperBinding` 读元数据

```ts
function resolveMapperBinding(tableOrEntity, idFieldOrOptions = "id") {
  // 写法 1：直接表名
  if (typeof tableOrEntity === "string") {
    return { tableName: tableOrEntity, options: idFieldOrOptions };
  }

  // 写法 2：实体类
  const meta = getEntityTableMeta(tableOrEntity);
  if (!meta?.tableName) {
    throw new Error(`[Mapper] 实体 ${tableOrEntity.name} 缺少 @TableName`);
  }

  const base = typeof idFieldOrOptions === "string"
    ? { idField: idFieldOrOptions }
    : { ...idFieldOrOptions };

  return {
    tableName: meta.tableName,          // ← 从 @TableName 来
    options: {
      idField: base.idField ?? meta.idColumn, // ← 可从 @TableId 来
      ...base,
      entity: tableOrEntity,            // ← 留给填充 / 字段 Select
    },
  };
}
```

**所以：不是 Mapper「聪明」，是 Entity 上已经写好了表名。**  
若 Entity 没加 `@TableName`，这里会直接抛错。

#### 步骤 D：混入 CRUD（原型委托）

```ts
for (const method of MAPPER_DELEGATE_METHODS) {
  // selectById, selectList, insert, updateById, deleteById, ...
  ctor.prototype[method] = function (...args) {
    const mapper = table(tableName, options); // ORM 层真正的 BaseMapper（带缓存）
    return mapper[method](...args);
  };
}
Container.bindClass(UserMapper); // 按类绑定到 Inversify
```

`table()`（`ORM/table.ts`）按配置缓存 `BaseMapper` 实例，真正拼 SQL、逻辑删除、填充都在那里。

#### 步骤 E：若传的是实体，还记下 MAPPER_ENTITY_KEY

```ts
if (typeof tableOrEntity !== "string") {
  Reflect.defineMetadata(MAPPER_ENTITY_KEY, tableOrEntity, ctor);
}
```

供后续「查询结果自动填字段级 `@Select`」等使用。

### 4.4 两种写法对比

```ts
// A. 只关心表名
@Mapper("sys_user", "user_id")
class UserMapper {}

// B. 绑定实体（推荐）：自动表名 + 主键列 + 填充 + 字段 @Select
@Mapper(User, { logicDelete: true })
class UserMapper {}
```

### 4.5 自定义 SQL 方法

`@Mapper` 只混入标准 CRUD。自定义查询靠方法上的 `@Select` 等（见 ORM 文档）——装饰器会**替换方法体**为执行 SQL 的函数。这些自定义方法名也会被 `@Service` 再委托一层。

```ts
@Mapper(User)
class UserMapper {
  @Select("SELECT * FROM sys_user WHERE username = #{username}")
  findByUsername(@Param("username") username: string) {}
}
```

---

## 五、`@Service(MapperClass)`

### 做什么（三件事）

1. 记住关联的 Mapper 类（`MAPPER_BEAN_KEY`）
2. 把 **BaseMapper CRUD + Mapper 上自定义方法** 全部挂到 Service 原型（业务里可 `this.selectById`）
3. 按类名注册到 Container

### 参数

| 参数 | 说明 |
|------|------|
| `MapperClass` | Mapper 的构造函数，如 `UserMapper` |

### 实现要点

```ts
export function Service(MapperClass: Ctor): ClassDecorator {
  return (ctor) => {
    (ctor as any)[MAPPER_BEAN_KEY] = MapperClass;

    // 1) 标准 CRUD 委托
    for (const method of MAPPER_DELEGATE_METHODS) {
      ctor.prototype[method] = function (...args) {
        const mapper = resolveMapper(this, MapperClass);
        return mapper[method](...args);
      };
    }

    // 2) Mapper 原型上的自定义方法（@Select 等替换后的函数）也转发
    for (const key of Object.getOwnPropertyNames(MapperClass.prototype)) {
      if (key === "constructor") continue;
      if (MAPPER_DELEGATE_METHODS.includes(key)) continue;
      const desc = Object.getOwnPropertyDescriptor(MapperClass.prototype, key);
      if (!desc || typeof desc.value !== "function") continue;
      ctor.prototype[key] = function (...args) {
        return resolveMapper(this, MapperClass)[key](...args);
      };
    }

    Container.bindClass(Ctor);
  };
}
```

`resolveMapper`：优先 `Container.get(MapperClass)`，否则 `new MapperClass()`，并缓存在 `serviceInstance.__mapper`。

### 用法

```ts
@Service(UserMapper)
export default class UserService {
  // 自动有 selectById / insert / findByUsername ...
  async create(dto: CreateUserDto) {
    return this.insert(dto);
  }
}

@Controller("/api/user")
class UserController {
  @Resource(UserService)
  private userService!: UserService;

  @GetMapping("/:id")
  detail(@RequestPath() id: string) {
    return this.userService.selectById(id);
  }
}
```

### 调用链（一次 insert）

```
Controller.this.userService          // @Resource → Container.get("UserService")
  → UserService.insert(dto)          // @Service 挂在原型上的委托方法
    → resolveMapper → UserMapper
      → UserMapper.insert            // @Mapper 挂的委托
        → table("sys_user", { entity: User, ... }).insert(dto)
          → BaseMapper：拼 INSERT、逻辑删字段、applyEntityFieldFills(User, ...)
```

---

## 六、委托方法列表（`MAPPER_DELEGATE_METHODS`）

```ts
[
  "selectById", "selectOne", "selectList", "selectCount", "selectPage",
  "insert", "updateById", "update", "deleteById", "delete",
]
```

这些是 MyBatis-Plus 风格精简 CRUD，并包含 `saveBatch`、`deleteByIds`。

---

## 七、为何「能识别」——和扫描的关系

| 装饰器 | 识别方式 |
|--------|----------|
| `@Component` / `@Mapper` / `@Service` | 文件被 require 时装饰器执行 → `Container.register`；**不依赖** Application 扫描逻辑本身，但依赖扫描把文件加载进来 |
| `@Resource` | 不注册，只读容器；要求目标已 register |
| 扫描顺序 | `entity → mapper → service → controller`，保证表元数据 → Mapper 注册 → Service 注册 → Controller 注入 |

若你手动 `import "./mapper/user"` 而不走扫描，只要 import 执行了，Container 里同样有 Bean。

---

## 八、对照速查

| 装饰器 | 作用对象 | 关键动作 |
|--------|----------|----------|
| `@Component(name?)` | 类 | `bindClass`；可选 `bindAlias` |
| `@Resource(Type)` | 属性 | getter → `Container.get(Type)` |
| `@Mapper(table\|Entity, opts?)` | 类 | 解析表名 + 混入 CRUD + `bindClass` |
| `@Service(MapperClass)` | 类 | 委托 Mapper 方法 + `bindClass` |
