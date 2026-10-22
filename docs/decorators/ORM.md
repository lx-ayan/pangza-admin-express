# ORM 装饰器：实体如何绑定表、SQL 注解如何工作

源码：

- `entityDecorators.ts` — `@TableName` / `@TableId` / `@TableField`
- `sqlDecorators.ts` — `@Select` / `@Insert` / `@Update` / `@Delete` / `@Param`
- `fieldSelect.ts` + `hydrate.ts` — 属性级 `@Select` 与水合
- `tableSearch.ts` — `@TableSearch` / `getQueryWrapper` / `getQueryWrapperAndPage`
- `QueryWrapper.ts` — 条件构造（not*、exists、groupBy/having、大 IN 分片、方言 LIKE ESCAPE）
- `table.ts` + `BaseMapper.ts` — CRUD；`physicalDelete*`；`saveOrUpdate`；`updateBatch`；`updateNullStrategy`
- `transactional.ts` — `@Transactional`（REQUIRED / REQUIRES_NEW）
- `tableSearch.ts` — `@TableSearch`（含 NOT_LIKE / IN / BETWEEN / IS_NULL 等）
- 使用约定见 [ORM使用约定.md](../ORM使用约定.md)；迁移见 `migrations/`
- 与 Service 的衔接见 [Service.md](./Service.md)

---

## 一、整体模型

```
实体类 User
  @TableName / @TableId / @TableField / 属性@Select
       ↓ Reflect 元数据
getEntityTableMeta(User) / getFieldSelects(User)
       ↓
@Mapper(User) → table("sys_user", { entity: User, ... })
       ↓
BaseMapper：拼 SQL、逻辑删、乐观锁、insertFill、查询后 hydrateFieldSelects

分页表单 UserPageDTO
  @TableSearch({ operator: LIKE })
       ↓ Reflect 元数据
getQueryWrapperAndPage(form, UserPageDTO, pageNum, pageSize, consumer?)
       ↓
QueryWrapper + { current, size } → selectPage
```

---

## 二、为什么「传 Entity 就知道表」？（再讲一遍，从 ORM 侧）

### 2.1 `@TableName` 只做一件事：把表名贴在类上

```ts
export function TableName(tableName: string): ClassDecorator {
  return (ctor) => {
    Reflect.defineMetadata(TABLE_NAME_KEY, String(tableName).trim(), ctor);
  };
}
```

```ts
@TableName("sys_user")
class User {}
// 内存中：User 构造函数 → metadata[tableName] = "sys_user"
```

### 2.2 `@TableId` / `@TableField` 把「属性 ↔ 列」记到同一张 map

```ts
function saveField(ctor, meta) {
  const map = { ...fieldMap(ctor), [meta.property]: meta };
  Reflect.defineMetadata(FIELDS_KEY, map, ctor);
  addBeanKey(ctor, meta.property); // 顺带登记给 convert / Json
}
```

### 2.3 读取入口：`getEntityTableMeta`

```ts
export function getEntityTableMeta(entity: Ctor): EntityTableMeta | undefined {
  const tableName = getTableName(entity); // Reflect.getOwnMetadata(TABLE_NAME_KEY)
  if (!tableName) return undefined;
  const fields = getEntityFields(entity);
  const idField = fields.find((f) => f.id);
  return {
    tableName,
    idColumn: idField?.column ?? "id",
    fields,
  };
}
```

### 2.4 `@Mapper(User)` 调用的正是这个函数

见 Service 文档 `resolveMapperBinding`：  
`typeof tableOrEntity !== "string"` 时 → `getEntityTableMeta` → 得到 `tableName`，并 `options.entity = User` 传给 `BaseMapper`。

**识别条件：**

1. Entity 文件已被加载（扫描 `entity` 阶段或被 import）
2. 类上有 `@TableName`
3. Mapper 装饰器执行时传入的是该类的构造函数

---

## 三、实体注解全解

### 3.1 `@TableName(tableName)`

| 项 | 内容 |
|----|------|
| 类型 | 类装饰器 |
| 参数 | `tableName: string`，不能为空 |
| 写入 | `pangza.orm.tableName` |
| 谁读 | `getEntityTableMeta`、`@Mapper(Entity)` |

```ts
@TableName("sys_user")
export class User {}
```

---

### 3.2 `@TableId(valueOrOptions?)`

| 项 | 内容 |
|----|------|
| 类型 | 属性装饰器 |
| 参数 | 省略 → 列名=属性名；`string` → 列名；`{ value }` → 列名 |
| 写入 | `entityFields[property] = { id: true, column, exist: true }` |
| 谁读 | `idColumn`；BaseMapper 更新/删除按主键 |

```ts
@TableId()              // 列名 id
id!: string;

@TableId("user_id")     // 列名 user_id
id!: string;

@TableId({ value: "user_id" })
id!: string;
```

实现：

```ts
export function TableId(valueOrOptions?: string | TableIdOptions): PropertyDecorator {
  return (target, propertyKey) => {
    let column = String(propertyKey);
    if (typeof valueOrOptions === "string") column = valueOrOptions || column;
    else if (valueOrOptions?.value) column = valueOrOptions.value;
    saveField(target.constructor, {
      property: String(propertyKey), column, id: true, exist: true,
    });
  };
}
```

---

### 3.3 `@TableField(valueOrOptions?)`

| 项 | 内容 |
|----|------|
| 类型 | 属性装饰器 |
| 参数 | 列名字符串，或完整 options |

**TableFieldOptions：**

| 字段 | 默认 | 含义 |
|------|------|------|
| `value` | 属性名 | 数据库列名 |
| `exist` | `true` | `false`：非表字段，不参与默认 SQL 映射 |
| `insertFill` | — | 插入时若该列仍为 `undefined` 则填充（常量或函数） |
| `updateFill` | — | 更新时同上 |

```ts
@TableField("nick_name")
nickname?: string;

@TableField({
  value: "create_time",
  insertFill: () => new Date(),
})
createTime?: Date;

@TableField({
  value: "update_time",
  updateFill: () => new Date(),
})
updateTime?: Date;

@TableField({ exist: false })
displayLabel?: string; // 仅内存/接口用，不进 INSERT
```

**填充如何生效：**

`BaseMapper.insert/update*` 在写库前调用：

```ts
await applyEntityFieldFills(entityClass, row, "insert" | "update");
```

```ts
// 仅当 row[列] / row[属性] 仍为 undefined 时写入
// 只写「列名」key，避免 camelCase 被当成 SQL 列
row[colKey] = await resolveFieldFill(fill);
```

全局还有 `configureOrm({ fillCreateTime, ... })` / `setMetaObjectHandler`，与字段 fill 配合。

---

## 四、方法级 SQL 注解

### 4.1 核心原理：装饰器「换掉」方法体

`@Select` / `@Insert` / `@Update` / `@Delete` **不是**记一条元数据再等调度，而是直接把方法实现替换成执行器：

```ts
function createSqlMethodDecorator(kind: SqlKind) {
  return (sql: string): MethodDecorator => {
    const template = String(sql);
    return (target, propertyKey, descriptor) => {
      const executor = async function (...args: unknown[]) {
        const ctx = buildParamContext(args, getNamedParams(target, propertyKey));
        const parsed = parseMybatisSql(template, ctx); // #{} → ?  ， ${} → 拼接
        const result = await Db.query(parsed.sql, parsed.params);
        if (kind === "select") return result;          // 行数组
        if (kind === "insert") return header.insertId;
        return header.affectedRows;
      };
      descriptor.value = executor;
      return descriptor;
    };
  };
}
```

因此：

```ts
@Select("SELECT * FROM sys_user WHERE id = #{id}")
findById(@Param("id") id: string) {}
```

调用 `mapper.findById("1")` 时，跑的是上面的 `executor`，原来的空方法体不存在。

### 4.2 `@Param(name)`

| 项 | 内容 |
|----|------|
| 类型 | 参数装饰器 |
| 参数 | SQL 里用的名字，对应 `#{name}` / `${name}` |
| 写入 | `pangza.orm.sqlParamNames`，键为参数下标 |

```ts
Reflect.defineMetadata(PARAM_NAMES_KEY, { 0: "id", 1: "name" }, target, methodName);
```

执行时 `buildParamContext(args, namedMap)` → `{ id: args[0], name: args[1] }`。

| 占位符 | 行为 | 注意 |
|--------|------|------|
| `#{x}` | 预编译绑定 `?` | 安全，优先用 |
| `${x}` | 字符串替换进 SQL | 仅可信内容，防注入 |

### 4.3 `@Select(sql)`（方法）

| 项 | 内容 |
|----|------|
| 返回 | `RowDataPacket[]` |
| 注意 | 方法级查询**默认不**自动跑字段级 `@Select`（避免 N+1）；需要时手动 `hydrateFieldSelects(Entity, rows)` |

```ts
@Select("SELECT * FROM sys_user WHERE username = #{username} AND status = #{status}")
findActive(
  @Param("username") username: string,
  @Param("status") status: number
) {}
```

### 4.4 `@Insert(sql)` / `@Update(sql)` / `@Delete(sql)`

| 装饰器 | 返回值 | 说明 |
|--------|--------|------|
| `@Insert` | `insertId` | 物理插入 |
| `@Update` | `affectedRows` | |
| `@Delete` | `affectedRows` | **物理删除**；逻辑删请用 BaseMapper 的 `delete*` |

```ts
@Insert("INSERT INTO sys_user(user_name, password) VALUES(#{username}, #{password})")
addUser(@Param("username") u: string, @Param("password") p: string) {}

@Update("UPDATE sys_user SET status=#{status} WHERE id=#{id}")
updateStatus(@Param("id") id: string, @Param("status") status: number) {}

@Delete("DELETE FROM sys_user WHERE id=#{id}")
removeHard(@Param("id") id: string) {}
```

---

## 五、属性级 `@Select`（字段映射 / 嵌套查询）

### 5.1 和「方法级 @Select」如何区分？

同一个 `Select` 函数根据装饰器形态分支：

```ts
export function Select(sql: string, options?: FieldSelectOptions) {
  return (target, propertyKey?, descriptor?) => {
    // 有 descriptor.value 且是函数 → 方法装饰器 → createSqlMethodDecorator
    if (descriptor && typeof descriptor.value === "function") {
      return createSqlMethodDecorator("select")(sql)(...);
    }
    // 否则 → 属性装饰器 → registerFieldSelect
    registerFieldSelect(target.constructor, String(propertyKey), sql, options);
  };
}
```

### 5.2 属性级做什么？

把「再查一次 SQL 的结果」填进实体的某个字段（对齐 MyBatis association / collection）。

```ts
@TableName("sys_menu")
class Menu {
  @TableId()
  id!: string;

  // collection：一对多
  @Select("SELECT * FROM sys_menu WHERE parent_id = #{id}", { many: true })
  children?: Menu[];

  // association / 标量
  @Select(
    `SELECT name FROM sys_role WHERE id = (
       SELECT role_id FROM sys_menu_role WHERE menu_id = #{id} LIMIT 1
     )`,
    { column: "name" }
  )
  roleName?: string;
}
```

### 5.3 FieldSelectOptions

| 字段 | 默认 | 含义 |
|------|------|------|
| `many` | `false` | `true` → 数组；`false` → 单行/单值 |
| `column` | — | 只取该列；配合 many 得到标量数组 |
| `depth` | `0` | 嵌套行是否继续 hydrate；树可设 `1+` |
| `eager` | `true` | 是否在 `selectList` 等结果上自动填充。`列 = #{父字段}` 会合并成一条 `IN`；子查询 / LIMIT 仍逐行。树形全量加载建议 `false` |

写入：`pangza.orm.fieldSelect`。

### 5.4 何时真正执行？——水合 `hydrateFieldSelects`

`BaseMapper.selectList` / `selectPage`（在绑定了 `entity` 时）会调用水合：

```
对每一行 parentRow：
  ctx = buildRowParamContext(parentRow, Entity)
       // 同时提供 id / user_id / camel / snake，方便 #{id}
  对每个 FieldSelectMeta：
    解析 SQL → Db.query
    按 many/column 映射成值
    parentRow[property] = value
    若 depth>0 再递归
```

`buildRowParamContext` 保证父行字段无论下划线还是驼峰，SQL 里 `#{id}` 都能取到。

---

## 六、与 BaseMapper / 配置的关系

| 能力 | 如何开启 | 注解关系 |
|------|----------|----------|
| 逻辑删除 | `configureOrm` 或 `@Mapper({ logicDelete: true })` | 走 BaseMapper.delete*，不是 `@Delete` SQL |
| 乐观锁 | `optimisticLock` + `versionField` | 更新时带版本条件 |
| 自动时间/操作人 | `configureOrm({ fillCreateTime... })` 或 `@TableField insertFill` | 插入更新前填充 |
| SQL 日志 | `configureOrm({ sqlLog: true })` 或环境变量 | 打印执行 SQL |
| 事务 | `@Transactional()` 或 `Db.transaction(fn)` | 失败回滚；嵌套加入外层。事务内 `Db.query` / BaseMapper 走同一连接 |
| 批量 | `saveBatch(list)` / `deleteByIds(ids)` | 一条（或分批）SQL；逻辑删除时 `deleteByIds` 为 UPDATE |

`table(tableName, options)` 按 options 缓存 BaseMapper，避免重复 new。

---

## 七、推荐实体 + Mapper 完整示例

```ts
// entity/user.ts
@TableName("sys_user")
export class User {
  @TableId("user_id")
  id!: string;

  @TableField("user_name")
  username!: string;

  @TableField({
    value: "create_time",
    insertFill: () => new Date(),
  })
  createTime?: Date;

  @TableField({ exist: false })
  token?: string;
}

// mapper/user.ts
@Mapper(User, { logicDelete: true })
export default class UserMapper {
  @Select("SELECT * FROM sys_user WHERE user_name = #{username} LIMIT 1")
  findByUsername(@Param("username") username: string) {}
}

// service
@Service(UserMapper)
export default class UserService {}
```

加载顺序保证：`entity` 文件先 require → `@TableName` 已写入 → `@Mapper(User)` 能读到表名。

---

## 九、`@TableSearch` 与 `getQueryWrapperAndPage`

对齐 Java `@TableSearch` + `MybatisPlusUtil`。JSON form 是 plain object，**必须传 DTO 类**读取元数据。

### 9.1 `@TableSearch(options?)`

| 项 | 内容 |
|----|------|
| 类型 | 属性装饰器 |
| 参数 | 省略 / `OperType` / `{ column?, operator? }` |
| 默认 | `operator=EQ`；`column` 空则属性名 camel → snake |
| 写入 | `pangza.orm.tableSearch` + `addBeanKey` |

```ts
import { TableSearch, OperTypeEnum } from "@/framework/ORM";

export class UserPageDTO {
  @TableSearch({ operator: OperTypeEnum.LIKE })
  username?: string;

  @TableSearch({ operator: OperTypeEnum.LIKE })
  nickName?: string; // → nick_name

  @TableSearch({ column: "name_zh", operator: OperTypeEnum.LIKE })
  name?: string; // form.name → 列 name_zh
}
```

**OperTypeEnum：** `EQ` / `LIKE` / `LIKE_LEFT` / `LIKE_RIGHT` / `GT` / `GE` / `LT` / `LE` / `NE`。

空值（`null` / `undefined` / `''` / `[]`）跳过。

### 9.2 `getQueryWrapper` / `getQueryWrapperAndPage`

```ts
getQueryWrapper(form, UserPageDTO, consumer?)

getQueryWrapperAndPage(form, UserPageDTO)
getQueryWrapperAndPage(form, UserPageDTO, pageNum, pageSize)
getQueryWrapperAndPage(form, UserPageDTO, pageNum, pageSize, consumer)
getQueryWrapperAndPage(form, UserPageDTO, consumer)
```

返回值：

```ts
{ queryWrapper: QueryWrapper; page: { current: number; size: number } }
```

业务用法：

```ts
const { queryWrapper, page } = getQueryWrapperAndPage(
  pageRequest?.form ?? {},
  UserPageDTO,
  pageRequest?.pageNum ?? 1,
  pageRequest?.pageSize ?? 10,
  (w) => {
    w.select("id", "username", "nick_name").orderByDesc("create_time");
  }
);
const result = await this.selectPage(page, queryWrapper);
```

仓库内已接入：`UserPageDTO`、`RolePageDTO`、`GetMenuPageDTO`。

---

## 十、注解速查

| 注解 | 位置 | 关键作用 |
|------|------|----------|
| `@TableName` | 类 | 表名元数据 |
| `@TableId` | 属性 | 主键列 |
| `@TableField` | 属性 | 列映射 + insert/updateFill + exist |
| `@TableSearch` | 属性（Page DTO） | 列表/分页查询条件元数据 |
| `@Param` | 参数 | SQL 命名参数 |
| `@Select` | 方法 | 换方法体执行查询 |
| `@Select` | 属性 | 注册字段查询，结果水合 |
| `@Insert` / `@Update` / `@Delete` | 方法 | 换方法体执行写操作 |
| `@Transactional` | 类 / 方法 | 开启事务，失败回滚，嵌套加入外层 |

**工具函数：** `getQueryWrapper` / `getQueryWrapperAndPage`（配合 `@TableSearch`）。
