# ORM 扩展设计：XML Mapper 与关联关系

> 状态：**部分已实现** — R1、X1-a/b 已落地；R2–R5、X1-c/d 待做。  

> 对齐：现有 `@Select` / `parseMybatisSql` / 字段水合 `hydrateFieldSelects`、MyBatis / MyBatis-Plus 习惯。  
> 关联映射原清单 **F9**；XML 为新增能力线（建议记为 **X1**）。

相关：[ORM使用约定.md](./ORM使用约定.md) · [ORM开发清单.md](./ORM开发清单.md) · [decorators/ORM.md](./decorators/ORM.md)

---

## 一、要不要支持 `.xml` 写 SQL？

### 1.1 结论

**可以支持，且值得做**——作为装饰器 SQL 的**并列入口**，不是替换。

| 场景 | 推荐 |
| --- | --- |
| 单表 CRUD、简单条件 | `BaseMapper` + `QueryWrapper` / `@TableSearch` |
| 短 SQL、强类型方法 | 方法 `@Select` / `@Insert` … |
| 长 SQL、动态片段、`<if>`/`<foreach>`、多结果映射 | **XML Mapper** |
| 字段级关联填充 | 见第二节（装饰器一等公民；XML 可复用同一套 ResultMap） |

现有 `parseMybatisSql` 已吃 `#{}` / `${}`，XML 解析后最终仍落到「模板 + 参数上下文 → SQL + params → `Db.queryOn`」，与装饰器共用执行管线。

### 1.2 能力边界（建议第一期子集）

对齐 MyBatis **常用子集**，避免一次做完整引擎：

| 支持（P0） | 暂缓 / 不做（首期） |
| --- | --- |
| `<mapper namespace="...">` | `<cache>` / 二级缓存 |
| `<select|insert|update|delete id="...">` | `<sql>` 跨文件复杂 include 图（可先同文件） |
| `#{}` / `${}`（复用现有安全策略） | OGNL 全量表达式 |
| `<if>` / `<where>` / `<set>` / `<trim>` | `<choose>`/`<when>`/`<otherwise>`（P1） |
| `<foreach>`（IN / 批量 VALUES） | 嵌套 `<select>` 的 association 自动嵌套查询（用 ResultMap + 关联层） |
| `<include refid="..."/>`（本文件 `<sql>`） | Provider / 注解与 XML 混编同一 method 覆盖规则要写清 |
| `resultType` 简单行映射；`resultMap` 列→属性 | 存储过程 |

动态节点求值语言建议：**受限 JS 表达式**（白名单属性访问，如 `status != null`、`ids.length > 0`），禁止任意 `eval`；参数来自方法入参 / `@Param` 同构的 `ctx`。

### 1.3 配置：置顶 XML 目录

根目录 `application.yaml`：

```yaml
orm:
  mapperLocations:
    - mappers/**/*.xml                    # 相对项目根；支持 ** 通配
    - src/modules/**/mapper/*.xml
  # 可选
  mapperReload: false                     # 开发可 true：改 XML 热加载（生产关）
```

约定：

- **置顶**：与 `orm.logicDelete` 同级，启动时扫描；也可 `configureOrm({ mapperLocations: [...] })` 覆盖。
- 路径相对 `process.cwd()`（项目根），也可用绝对路径；**不要**写 `classpath:`（易与 Java 混淆，已不支持该前缀）。
- 扫描到即注册：`namespace` + `id` → 语句定义；重复 id **启动失败**（与 MyBatis 一致，避免静默覆盖）。

目录示例：

```
project/
  application.yaml
  mappers/
    user/
      UserMapper.xml
    order/
      OrderMapper.xml
  src/
    mapper/
      UserMapper.ts          # 接口 / 类，方法与 xml id 对齐
```

### 1.4 与 TypeScript Mapper 的衔接（优雅写法）

**方式 A（推荐）：类方法空实现 + 启动绑定 XML**

```ts
@MapperXml("com.pangza.UserMapper")  // = XML namespace
@Mapper(User)                        // 仍可挂实体 / 数据源
class UserMapper {
  // id 与 XML <select id="findByRole"> 一致；实现由框架注入
  findByRole(@Param("roleId") roleId: number): Promise<User[]> {
    throw new Error("bound by XML"); // 可被装饰器替换，勿手写
  }
}
```

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper>
<mapper namespace="com.pangza.UserMapper">
  <sql id="cols">id, user_name, status</sql>

  <select id="findByRole" resultType="User">
    SELECT <include refid="cols"/>
    FROM sys_user
    <where>
      <if test="roleId != null">
        AND id IN (
          SELECT user_id FROM sys_user_role WHERE role_id = #{roleId}
        )
      </if>
      AND delete_flag = 0
    </where>
    ORDER BY id DESC
  </select>
</mapper>
```

**方式 B：纯命名空间调用（无类）**

```ts
await xmlMapper("com.pangza.UserMapper").selectList("findByRole", { roleId: 1 });
```

适合脚本 / 一次性报表；业务代码优先方式 A，便于 IoC 注入与类型提示。

**方式 C：与装饰器共存**

- 同一方法：若既有 `@Select("...")` 又有 XML id → **启动报错**（二选一）。
- 同一类：部分方法注解、部分 XML —— 允许。

### 1.5 运行时流程

```
启动
  → 读 orm.mapperLocations
  → 扫 XML → 解析 DOM → 注册 Statement(namespace, id, kind, nodes, resultMap?)
  → 扫描 @MapperXml 类 → 按方法名绑定 Statement → 替换 method 为执行器

调用 userMapper.findByRole(1)
  → buildParamContext(args, @Param)
  → 动态 SQL 渲染（if/foreach…）→ 文本模板
  → parseMybatisSql（#{} / ${}）→ sql + params
  → Db.queryOn(datasource)
  → mapResultRows / ResultMap →（可选）关联水合
```

开发态 `mapperReload: true`：对已注册文件做 mtime 监听，改文件重解析对应 namespace（注意并发调用下的原子替换）。

### 1.6 安全与 DX

- `${}` 继续走现有拒绝规则；XML 内更易滥用，文档强调：**用户输入禁止 `${}`**。
- `test` 表达式只允许访问参数对象属性与字面量比较，禁止 `Function` / `require`。
- 启动打印：`[ORM] loaded N statements from M xml files`；缺绑定方法时 warn。
- 单测：给一小段 XML fixture，断言渲染后的 SQL/params（不必连库）。

### 1.7 排期建议（XML）

| 阶段 | 内容 |
| --- | --- |
| X1-a | 扫描配置 + 静态 `<select>`（无动态节点）+ 类方法绑定 |
| X1-b | `<if>` `<where>` `<foreach>` `<include>` |
| X1-c | `resultMap` 简单映射；热加载 |
| X1-d | `<choose>`；与 ResultMap 关联（第二节）打通 |

---

## 二、关联关系：如何优雅地写

### 2.1 现状与缺口

今天已有：

- 字段 `@Select("SELECT ... WHERE parent_id = #{id}", { many: true })` + `hydrateFieldSelects`
- 简单等值可合并为 `IN (...)`，减轻 N+1
- `eager` / `depth` / `column`

缺口（清单 F9）：

- 无「目标实体 / 外键 / 中间表」一等元数据 → 写侧、级联、类型不安全
- 无声明式 Join 查询（只能手写 SQL 或字段二次查询）
- 多对多 sync（差量增删中间表）缺失

目标：**读侧优雅、写侧可控、默认不魔法级联**（管理端 ORM，避免 JPA 式隐式 cascade 踩坑）。

### 2.2 设计原则

1. **声明在实体上，执行在 Mapper / 水合层**（与现有 `@TableField` / 字段 `@Select` 一致）。
2. **三种读策略显式选择**：`SELECT`（二次查询，默认可批 IN）、`JOIN`（一次查出）、`LAZY`（手动 `hydrate`）。
3. **写默认不级联**；需要时显式 `saveWith(relations)` / `syncRelation`。
4. **关联装饰器可编译成今天的字段 `@Select`**（过渡兼容），新代码用语义化 API。
5. XML `resultMap` 的 association/collection 与装饰器 **共用同一 RelationMeta**。

### 2.3 推荐 API（装饰器）

```ts
@TableName("sys_user")
class User {
  @TableId({ type: IdType.ASSIGN_ID })
  id!: string;

  @TableField("user_name")
  userName!: string;

  /** 多对一：本表 role_id → Role.id */
  @ManyToOne(() => Role, {
    foreignKey: "role_id",      // 本表列（库列名）
    targetKey: "id",            // 目标主键，默认 id
    eager: true,                // selectList 时填充
    fetch: "SELECT",            // SELECT | JOIN（JOIN 仅部分查询路径支持）
  })
  role?: Role;

  /** 一对多：Menu.parent_id → 本表 id */
  @OneToMany(() => Menu, {
    foreignKey: "parent_id",    // 对方表列
    eager: false,               // 默认懒：避免树爆炸
    many: true,
  })
  children?: Menu[];

  /** 多对多：中间表 */
  @ManyToMany(() => Role, {
    joinTable: "sys_user_role",
    joinColumn: "user_id",      // 指向本表
    inverseJoinColumn: "role_id",
    eager: false,
  })
  roles?: Role[];
}
```

等价心智模型（框架内部可生成）：

| 装饰器 | 默认生成的读 SQL 形态 |
| --- | --- |
| `@ManyToOne` | `SELECT * FROM role WHERE id = #{role_id}` → 单对象 |
| `@OneToMany` | `SELECT * FROM menu WHERE parent_id = #{id}` → 数组；父行批查时 `parent_id IN (...)` |
| `@ManyToMany` | `SELECT r.* FROM role r JOIN sys_user_role ur ON ... WHERE ur.user_id = #{id}`；批查时 `user_id IN (...)` |

旧写法字段 `@Select(...)` **继续可用**，与新装饰器互斥于同一属性（同时存在则启动报错）。

### 2.4 查询时怎么用（优雅调用）

```ts
// 1）跟随实体 eager 配置（零额外代码）
await userMapper.selectById(id);

// 2）本次指定要填的关联（覆盖 eager）
await userMapper.selectList(wrapper, {
  relations: ["role", "roles"],           // 白名单
  // relations: false                     // 全部不填
});

// 3）手动水合（树、导出、二次填充）
await hydrateRelations(User, rows, { relations: ["children"], depth: 2 });

// 4）JOIN 一次取出（仅 fetch:JOIN 且查询 API 支持时）
await userMapper.selectList(wrapper, {
  relations: [{ name: "role", fetch: "JOIN" }],
});
// 内部：SELECT u.*, r.id AS r__id, r.name AS r__name FROM user u LEFT JOIN role r ...
// 再按前缀拆成 user.role
```

`selectPage` 的 `total` 仍按主表计数；JOIN 时注意一对多导致行膨胀 → **分页路径默认禁止一对多 JOIN**，改用 SELECT 二次查询或先分页主表再水合（文档写死这条铁律）。

### 2.5 写侧（克制而清晰）

```ts
// 只更新主表
await userMapper.updateById({ id, userName: "x" });

// 显式同步多对多（差量：算增删中间表行）
await userMapper.syncManyToMany(id, "roles", ["role-1", "role-2"]);

// 可选：带关联保存（文档标明级联范围）
await userMapper.saveWith(user, {
  relations: {
    roles: "SYNC",          // 中间表差量
    children: "NONE",       // 不碰
    // profile: "UPSERT",   // 一对一可选
  },
});
```

原则：**没有 `cascade = ALL` 默认值**；管理端删除主表时关联行是否清理由业务显式调用，避免误删。

### 2.6 与 XML ResultMap 对齐

```xml
<resultMap id="UserWithRole" type="User">
  <id property="id" column="id"/>
  <result property="userName" column="user_name"/>
  <association property="role" javaType="Role"
               select="com.pangza.RoleMapper.selectById"
               column="role_id"/>
  <collection property="roles" ofType="Role"
              select="com.pangza.UserMapper.selectRolesByUserId"
              column="id"/>
</resultMap>

<select id="selectById" resultMap="UserWithRole">
  SELECT * FROM sys_user WHERE id = #{id}
</select>
```

`select` 嵌套查询与装饰器 `fetch: SELECT` 走同一批 IN 优化器；`resultMap` 内嵌 join 列前缀映射走 JOIN 拆行逻辑。

### 2.7 不优雅、明确不做的

- 在 `QueryWrapper` 上无限链式 `.leftJoin().on()` 做成第二套 DSL（成本高、与方言分页纠缠）——若需要复杂 Join，**XML 或 `@Select` 字符串优先**。
- 隐式级联删除 / 级联 insert 整棵图。
- 代理 Lazy 在 Node 里用 getter 触发 IO（请求周期难控）——统一 **显式 hydrate / relations 选项**。

### 2.8 排期建议（关联）

| 阶段 | 内容 |
| --- | --- |
| R1 | `@ManyToOne` / `@OneToMany` 元数据 + 编译为现有 hydrate 路径；`relations` 查询选项 |
| R2 | `@ManyToMany` 读；`syncManyToMany` |
| R3 | JOIN 拆行（仅 to-one）；分页禁 to-many JOIN |
| R4 | XML `resultMap` association/collection 与 R1 打通 |
| R5 | `saveWith` 显式策略（按需） |

---

## 三、两者如何配合（总图）

```
                    ┌─────────────────────┐
   application.yaml │ mapperLocations[]   │
                    │ relation 默认策略等  │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
   XML Statements        实体 RelationMeta      方法 @Select
   (动态 SQL)            (@ManyToOne…)          (短 SQL)
         │                     │                     │
         └──────────┬──────────┴──────────┬──────────┘
                    ▼                     ▼
              SQL 执行管线           水合 / ResultMap
           parseMybatisSql + Db         hydrateRelations
```

**推荐日常写法：**

1. 单表：`BaseMapper` + Wrapper。  
2. 复杂报表 / 动态条件：XML。  
3. 对象图读取：实体关联装饰器 + `relations`；极深树用 `eager: false` + 手动 hydrate。  
4. 复杂 Join 一次出宽表：XML `resultMap`，而不是硬撑 Wrapper。

---

## 四、决策清单（实现前确认）

| # | 问题 | 建议默认 |
| --- | --- | --- |
| 1 | XML 动态脚本用何种表达式？ | 受限属性表达式（非完整 OGNL） |
| 2 | XML 与 `@Select` 冲突？ | 启动失败 |
| 3 | 关联写是否默认级联？ | 否；仅 `sync` / `saveWith` |
| 4 | 分页 + 一对多 JOIN？ | 禁止；主表分页后再 SELECT 水合 |
| 5 | 旧字段 `@Select`？ | 长期兼容，同属性与新装饰器互斥 |
| 6 | 首期先做 XML 还是关联？ | **关联 R1 更贴业务**；XML X1-a 可并行（共用执行管线） |

---

## 五、文档索引更新

实现任一阶段时，同步：

- [ORM开发清单.md](./ORM开发清单.md)：F9 拆为 R1–R5；新增 X1  
- [ORM使用约定.md](./ORM使用约定.md)：XML 目录、关联读/写约定  
- [decorators/ORM.md](./decorators/ORM.md)：装饰器与 XML 示例  
