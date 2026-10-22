# ORM 使用约定

模板用户必读。细节装饰器见 [decorators/ORM.md](./decorators/ORM.md)；排期见 [ORM开发清单.md](./ORM开发清单.md)。

---

## 1. 列名用库字段，不是实体属性名

`QueryWrapper` / `@TableSearch` 的 column 是**数据库列名**（多为下划线）：

```ts
// ✅
new QueryWrapper().eq("user_name", "admin").orderByDesc("create_time")

// ❌ 库列是 user_name 时不要写驼峰（除非列名本身就是驼峰）
new QueryWrapper().eq("userName", "admin")
```

实体属性可以是驼峰；查询结果默认会做下划线 → 驼峰（`orm.mapUnderscoreToCamelCase`）。

---

## 2. `datasource` 优先于 `db`

| 选项 | 含义 |
| --- | --- |
| `datasource: "postgresql"` | 按**注册名**选源（推荐） |
| `db: "postgresql"` | 按**库类型**找唯一已注册源；同类型有两个会报错 |

环境自动注册名：`default`、附加 PG 为 `postgresql`、MSSQL 为 `sqlserver`（不是 `pg`）。

```ts
@Mapper(User, { datasource: "postgresql" })
@Select("...", { datasource: "report" })
@Transactional({ datasource: "default" })
```

按方言建 Wrapper（避免默认 MySQL 引号用在 PG 上）：

```ts
QueryWrapper.forDatasource("postgresql").eq("status", 1)
// 或
new QueryWrapper({ dialect: "postgresql" })
```

`nested()` 会继承外层方言。

---

## 3. 更新 null 策略

`undefined` 字段**从不**写入 UPDATE。`null` 默认会写成 SQL NULL：

```ts
table("user", { updateNullStrategy: "IGNORE" }) // null 也跳过
table("user", { updateNullStrategy: "INCLUDE" }) // 默认：写入 NULL
```

`saveOrUpdate(entity)`：无主键或库中不存在 → `insert`；否则 `updateById`。

---

## 4. 逻辑删除默认开启

全局 `orm.logicDelete` 默认 **true**。没有 `delete_flag`（或配置的字段）的表必须：

```ts
@Mapper(MenuRole, { logicDelete: false })
```

| API | 行为 |
| --- | --- |
| `delete` / `deleteById` / `deleteByIds` | 开启逻辑删除时 → `UPDATE` 标记删除 |
| `physicalDelete` / `physicalDeleteById` / `physicalDeleteByIds` | 始终 `DELETE`，忽略逻辑删除开关 |
| `wrapper.ignoreLogicDelete()` | 查询时包含已删行（回收站等） |

物理删除、条件删除都必须带 WHERE，防止全表删除。

---

## 5. 主键与 insert 返回值

| IdType | 说明 |
| --- | --- |
| `ASSIGN_ID`（默认） | 雪花 ID，类型为 **string**，勿当 number 混用 |
| `AUTO` | 库自增 |
| `INPUT` / `ASSIGN_UUID` / `NONE` | 见装饰器文档 |

`insert` 的返回值：自增场景多为数字 id；雪花等场景可能返回 `0`，**以实体上回写的主键为准**。

---

## 6. SQL 占位：优先 `#{}`

```ts
@Select("SELECT * FROM t WHERE id = #{id}")   // ✅ 参数绑定
@Select("SELECT * FROM ${table} WHERE id = #{id}") // ⚠️ 字符串拼接
```

- `#{}` → `?` 绑定，防注入  
- `${}` → 直接拼进 SQL，**仅可信标识符**；含 `;`、`--`、引号、SQL 关键字会**拒绝**；运行时会告警  

用户输入禁止走 `${}`。

---

## 7. SQL 日志

- 默认关闭；开发可在 YAML `orm.sqlLog.enabled: true` 或 `configureOrm({ sqlLog: true })`  
- **生产**默认关；若显式打开会告警，且参数中 `password` / `token` 等键会脱敏为 `***`  
- 生产勿长期打开明文 SQL 日志  

---

## 8. 事务

```ts
@Transactional() // REQUIRED：加入外层或新建
@Transactional({ propagation: "REQUIRES_NEW" }) // 独立连接，外层挂起
@Transactional({ datasource: "postgresql" })
```

跨数据源不会自动分布式事务；多源请拆步骤并自行保证一致性。

---

## 9. 分组与批量

```ts
wrapper.select("status").groupBy("status").having("COUNT(*) > ?", [1])
await mapper.updateBatch([{ id: 1, name: "a" }, { id: 2, name: "b" }])
```

YAML `orm.batch`（也可 `configureOrm`）：

| 键 | 默认 | 用途 |
| --- | --- | --- |
| `insertSize` | 200 | `saveBatch` |
| `updateSize` | 200 | `updateBatch` |
| `inSize` | 500 | `in`/`notIn` 分片、`deleteByIds` |

---

## 10. 兼容类型名（方言 / 配置别名）

`getDialect` / `DataSourceConfig.type` / `@Select({ db })` 接受：

| 规范名 | 别名 |
| --- | --- |
| `mysql` | `mariadb` |
| `postgresql` | `postgres`、`pg` |
| `sqlserver` | `mssql`、`sql-server` |

环境自动注册数据源名是 **`postgresql`** / **`sqlserver`**（不是 `pg`）。  
历史类型别名：`MysqlConfig` ≈ `DataSourceConfig`；`ResultSetHeader` / `RowDataPacket` 仍可从 `Db` 导入。

---

## 11. Schema 迁移

见仓库 `migrations/README.md`，执行：`npm run migrate`（default 数据源）。

---

## 12. 声明式关联（读）

```ts
@ManyToOne(() => Role, { foreignKey: "role_id" })  // 默认 eager
role?: Role;

@OneToMany(() => Menu, { foreignKey: "parent_id" }) // 默认 lazy
children?: Menu[];

await mapper.selectList();                          // 填 eager
await mapper.selectList(w, { relations: ["children"] });
await mapper.selectList(w, { relations: false });
await hydrateRelations(Menu, rows, { relations: ["children"] });
```

写侧默认不级联；多对多 sync / saveWith 见扩展设计 R2/R5。字段 `@Select` 仍可用，与关联装饰器不可同属性。

---

## 13. XML Mapper

```yaml
orm:
  mapperLocations:
    - mappers/**/*.xml   # 相对项目根；也可用绝对路径
  mapperReload: false
```

```ts
@MapperXml("com.pangza.UserMapper")
class UserMapper {
  findByRole(@Param("roleId") roleId: number): Promise<User[]> {
    throw new Error("bound by XML");
  }
}

await xmlMapper("com.pangza.UserMapper").selectList("findByRole", { roleId: 1 });
```

支持 `<sql>` / `<include>` / `<if>` / `<where>` / `<set>` / `<trim>` / `<foreach>`；`#{}` 走参数绑定。详见 [ORM扩展设计-XML与关联.md](./ORM扩展设计-XML与关联.md)。
