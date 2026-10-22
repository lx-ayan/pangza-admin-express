# ORM 开发清单

> 范围：仅 `src/framework/ORM` 及相关配置 / 文档。  
> 不含：CI、发包、Module、Auth 体系等框架其它部分。  
> 用途：定日程、排优先级。

使用约定：[ORM使用约定.md](./ORM使用约定.md) · 扩展设计：[ORM扩展设计-XML与关联.md](./ORM扩展设计-XML与关联.md) · 迁移：[migrations/README.md](../migrations/README.md)

---

## 1. 现状结论

| 维度 | 判断 |
| --- | --- |
| 单表 CRUD | 完整（P0–P2） |
| 声明式关联 | **R1 已落地**（ManyToOne / OneToMany / ManyToMany 读 + relations） |
| XML Mapper | **X1-a/b 已落地**（扫描、静态+if/where/foreach/include、@MapperXml / xmlMapper） |
| Join 拆行 / sync 写 / resultMap | R2–R5 / X1-c/d 待做 |

---

## 2. 功能补充

| ID | 项 | 状态 |
| --- | --- | --- |
| F1～F8 F10 F11 | P0–P2 | ✅ |
| F9 / R1 | `@ManyToOne` / `@OneToMany` / `@ManyToMany` 读 + `relations` / `hydrateRelations` | ✅ |
| R2 | `syncManyToMany` | ⬜ |
| R3 | JOIN 拆行（to-one） | ⬜ |
| R4 | XML resultMap association | ⬜ |
| R5 | `saveWith` | ⬜ |
| X1-a | XML 扫描 + 静态语句 + 类绑定 | ✅ |
| X1-b | `<if>` `<where>` `<foreach>` `<include>` | ✅ |
| X1-c | resultMap / 热加载增强 | ⬜（`mapperReload` 简版已有） |
| X1-d | `<choose>` + 关联打通 | ⬜ |

---

## 3. 安全 / 维护

S1～S7、M1～M10：✅（见历史表）

测试：`orm-*.test.ts`、`query-wrapper.test.ts`、`orm-relation.test.ts`、`orm-xml.test.ts`

---

## 4. 排期

| 阶段 | 状态 |
| --- | --- |
| P0 / P1 / P2 | ✅ |
| R1 / X1-a / X1-b | ✅ |
| R2+ / X1-c/d | 按需 |
