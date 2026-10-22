/**
 * 将 src/framework 打包为可 npm 发布的单包（packages/pangza-express）。
 *
 * 用法：npm run build:lib
 * 发布：cd packages/pangza-express && npm publish --access public
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const buildDir = path.join(root, "packages", "pangza-express-build");
const frameworkOut = path.join(buildDir, "framework");
const outDir = path.join(root, "packages", "pangza-express");
const rootPkg = require(path.join(root, "package.json"));

function run(command) {
  console.log(`[build:lib] $ ${command}`);
  const result = spawnSync(command, {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function rm(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const stat = fs.statSync(from);
    if (stat.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function writeLibPackageJson() {
  const libPkg = {
    name: "@pangza/express",
    version: rootPkg.version || "1.0.0",
    description:
      "TypeScript + Express 装饰器框架（IoC / ORM / Auth / Redis），对齐 Spring + MyBatis-Plus 风格",
    main: "./index.js",
    types: "./index.d.ts",
    exports: {
      ".": {
        types: "./index.d.ts",
        require: "./index.js",
        default: "./index.js",
      },
      "./package.json": "./package.json",
    },
    files: [
      "**/*.js",
      "**/*.d.ts",
      "**/*.d.ts.map",
      "**/*.js.map",
      "README.md",
    ],
    keywords: [
      "express",
      "typescript",
      "decorators",
      "orm",
      "ioc",
      "mybatis-plus",
      "spring",
    ],
    author: rootPkg.author || "",
    license: rootPkg.license || "ISC",
    repository: rootPkg.repository,
    bugs: rootPkg.bugs,
    homepage: rootPkg.homepage,
    engines: {
      node: ">=18",
    },
    peerDependencies: {
      express: "^4.18.0 || ^5.0.0",
      inversify: "^6.0.0 || ^8.0.0",
      "reflect-metadata": "^0.1.13 || ^0.2.0",
    },
    peerDependenciesMeta: {
      mysql2: { optional: true },
      pg: { optional: true },
      mssql: { optional: true },
      redis: { optional: true },
      jsonwebtoken: { optional: true },
      pino: { optional: true },
      "pino-pretty": { optional: true },
      cors: { optional: true },
      multer: { optional: true },
      "node-cron": { optional: true },
      bcryptjs: { optional: true },
      validator: { optional: true },
      "js-yaml": { optional: true },
      ip2region: { optional: true },
    },
    dependencies: {
      bcryptjs: rootPkg.dependencies.bcryptjs,
      cors: rootPkg.dependencies.cors,
      ip2region: rootPkg.dependencies.ip2region,
      "js-yaml": rootPkg.dependencies["js-yaml"],
      jsonwebtoken: rootPkg.dependencies.jsonwebtoken,
      mssql: rootPkg.dependencies.mssql,
      multer: rootPkg.dependencies.multer,
      mysql2: rootPkg.dependencies.mysql2,
      "node-cron": rootPkg.dependencies["node-cron"],
      pg: rootPkg.dependencies.pg,
      pino: rootPkg.dependencies.pino,
      "pino-pretty": rootPkg.dependencies["pino-pretty"],
      redis: rootPkg.dependencies.redis,
      validator: rootPkg.dependencies.validator,
    },
    publishConfig: {
      access: "public",
    },
  };

  fs.writeFileSync(
    path.join(outDir, "package.json"),
    JSON.stringify(libPkg, null, 2) + "\n",
    "utf8"
  );
}

function writeLibReadme() {
  const readme = `# @pangza/express

TypeScript + Express 装饰器框架（Application / ORM / Auth / Redis / IoC）。

## 安装

\`\`\`bash
npm i @pangza/express express reflect-metadata inversify
\`\`\`

## 最小用法

\`\`\`ts
import "reflect-metadata";
import { Application, Controller, GetMapping, Logger } from "@pangza/express";
import { json } from "express";
import cors from "cors";

@Controller("/api/hello")
class HelloController {
  @GetMapping("/")
  hello() {
    return { ok: true };
  }
}

Application.registry(Logger({ level: "info" }))
  .registry(cors())
  .registry(json())
  .scan("src")
  .start();
\`\`\`

更多说明见仓库文档：\`docs/快速开始-单包.md\`、\`docs/npm-多包使用指南.md\`。

## 发布（维护者）

\`\`\`bash
npm run build:lib
cd packages/pangza-express
npm publish --access public
\`\`\`
`;
  fs.writeFileSync(path.join(outDir, "README.md"), readme, "utf8");
}

function assertEntry() {
  const entry = path.join(outDir, "index.js");
  const types = path.join(outDir, "index.d.ts");
  if (!fs.existsSync(entry) || !fs.existsSync(types)) {
    console.error("[build:lib] 缺少入口 index.js / index.d.ts，请检查 tsc 输出");
    process.exit(1);
  }
}

function main() {
  rm(buildDir);
  rm(outDir);

  run("npx tsc -p tsconfig.pangza.json");
  run("npx tsc-alias -p tsconfig.pangza.json");

  if (!fs.existsSync(frameworkOut)) {
    console.error(
      "[build:lib] 未找到编译产物 framework/，请检查 tsconfig.pangza.json"
    );
    process.exit(1);
  }

  // 扁平化：packages/pangza-express-build/framework/* → packages/pangza-express/*
  copyDir(frameworkOut, outDir);
  rm(buildDir);

  writeLibPackageJson();
  writeLibReadme();
  assertEntry();

  console.log(`[build:lib] 完成 → ${path.relative(root, outDir)}`);
  console.log(
    "[build:lib] 试发布：cd packages/pangza-express && npm pack --dry-run"
  );
}

main();
