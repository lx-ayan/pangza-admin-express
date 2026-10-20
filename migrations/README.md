# Schema 迁移（SQL 版本目录）

ORM 不负责改表结构。本目录用**编号 SQL 文件**做轻量迁移，适合模板项目。

## 约定

1. 文件名：`V{序号}__简短说明.sql`（序号递增，如 `V1__init.sql`）
2. 每个文件可含多条语句，用 `;` 分隔
3. 已执行记录在表 `orm_schema_history`（自动创建）
4. **只升不降**；回滚请手写补偿脚本

## 用法

```bash
# 在项目根目录
node scripts/migrate.js
# 或
npm run migrate
```

环境与应用相同：读根目录 `application*.yaml`（`CONFIG_PATH` / `--config` 仍可用）。
仅对 **default** 数据源执行。

## 示例

见 `V1__orm_schema_history.sql`（建历史表本身也可放业务初始化脚本）。
