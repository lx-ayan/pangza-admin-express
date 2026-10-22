# create-pangza

初始化空项目，并按需生成 `entity` / `mapper` / `service` / `controller`。

## init

```bash
npx create-pangza init my-app
# 或
npm create pangza@latest -- init my-app
```

交互勾选模块：`orm` / `auth` / `redis` / `log` / `schedule` / `encrypt` / `validate`。  
勾选 `orm` / `redis` 时会写入 `EnableOrm()` / `EnableRedis()`；未勾选则启动不连库、不因缺配置报错。不生成 `.gitkeep`。

```bash
npx create-pangza init my-app --modules=orm,auth,redis --db=mysql
```

## generate（`g`）

在项目根目录执行：

```bash
npx create-pangza g controller user
npx create-pangza g service user
npx create-pangza g mapper user
npx create-pangza g entity user

# 一次生成整套用户模块
npx create-pangza g all user
```

别名：`c|controller|cotroller`、`s|service`、`m|mapper`、`e|entity`、`a|all`。  
覆盖已有文件：加 `--force`。

生成路径示例（`user`）：

```text
src/entity/user.ts
src/mapper/user.ts
src/service/user.ts
src/controller/user/index.ts   → /api/user
```

## 发布

```bash
cd create-pangza
npm publish --access public --registry=https://registry.npmjs.org
```
