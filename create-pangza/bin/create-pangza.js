#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { MODULES, DB_CHOICES } = require("../lib/modules");
const { scaffold } = require("../lib/scaffold");
const { generate, resolveKind } = require("../lib/generate");
const {
  createRl,
  askText,
  askSelect,
  askMulti,
  askYesNo,
} = require("../lib/prompt");

function usage() {
  console.log(`create-pangza — scaffold & generate for @pangza/express

Init (empty app + optional modules):
  create-pangza init [project-name]
  create-pangza init my-app --modules=orm,redis --db=mysql

Generate (run inside a project):
  create-pangza g controller user
  create-pangza g service user
  create-pangza g mapper user
  create-pangza g entity user
  create-pangza g all user

  Aliases: g|generate   c|controller|cotroller   s|service   m|mapper   e|entity   a|all
  Flags:   --force   overwrite existing files

Modules (init):
${MODULES.map((m) => `  ${m.id.padEnd(10)} ${m.hint}`).join("\n")}
`);
}

function parseArgs(argv) {
  const args = {
    cmd: null,
    name: null,
    modules: null,
    db: null,
    help: false,
    force: false,
    genKind: null,
    genName: null,
  };
  const rest = [];
  for (const a of argv) {
    if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--force" || a === "-f") args.force = true;
    else if (a.startsWith("--modules=")) {
      args.modules = a
        .slice("--modules=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a.startsWith("--db=")) {
      args.db = a.slice("--db=".length).trim();
    } else {
      rest.push(a);
    }
  }

  const head = rest[0];
  if (head === "init") {
    args.cmd = "init";
    args.name = rest[1] || null;
  } else if (head === "g" || head === "generate") {
    args.cmd = "generate";
    args.genKind = rest[1] || null;
    args.genName = rest[2] || null;
  } else if (head) {
    // 兼容：create-pangza my-app → init
    args.cmd = "init";
    args.name = head;
  }
  return args;
}

function isValidName(name) {
  return Boolean(name) && /^[a-zA-Z0-9._@/-]+$/.test(name) && !name.includes("..");
}

function normalizeProjectName(raw) {
  const base = path.basename(String(raw).replace(/[\\/]+$/, ""));
  return base.startsWith("@") ? base : base.toLowerCase();
}

async function runInit(args) {
  const rl = createRl();
  try {
    let projectNameInput = args.name;
    if (!projectNameInput) {
      projectNameInput = await askText(rl, "项目目录名", "pangza-app");
    }
    if (!isValidName(projectNameInput)) {
      console.error(`Invalid project name: ${projectNameInput}`);
      process.exit(1);
    }

    const targetDir = path.resolve(process.cwd(), projectNameInput);
    if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
      console.error(`Directory is not empty: ${targetDir}`);
      process.exit(1);
    }

    let modules = args.modules;
    if (!modules) {
      modules = await askMulti(
        rl,
        "选择要启用的模块（空模板默认只有 HTTP 核心）",
        MODULES.map((m) => ({
          value: m.id,
          label: m.label,
          hint: m.hint,
        })),
      );
    } else {
      const known = new Set(MODULES.map((m) => m.id));
      const bad = modules.filter((m) => !known.has(m));
      if (bad.length) {
        console.error(`Unknown modules: ${bad.join(", ")}`);
        process.exit(1);
      }
    }

    if (modules.includes("auth") && !modules.includes("redis")) {
      const addRedis =
        args.modules != null
          ? true
          : await askYesNo(
              rl,
              "Auth 通常需要 Redis 存 token，是否一并启用 redis？",
              true,
            );
      if (addRedis) modules = [...new Set([...modules, "redis"])];
    }

    let dbType = args.db || "mysql";
    if (modules.includes("orm")) {
      if (!args.db) {
        dbType = await askSelect(rl, "ORM 数据库类型", DB_CHOICES, "mysql");
      } else if (!DB_CHOICES.some((c) => c.value === args.db)) {
        console.error(`Unknown --db=${args.db}`);
        process.exit(1);
      }
    }

    const pkgName = normalizeProjectName(projectNameInput);
    scaffold({
      targetDir,
      projectName: pkgName,
      modules,
      dbType,
    });

    console.log(`
✓ 已初始化空项目: ${projectNameInput}
  模块: ${modules.length ? modules.join(", ") : "(仅核心)"}
${modules.includes("orm") ? `  数据库: ${dbType}\n` : ""}
下一步:
  cd ${projectNameInput}
  cp .env.example .env
  npm install
  npm run dev

生成业务文件:
  npx create-pangza g all user
`);
  } finally {
    rl.close();
  }
}

function runGenerate(args) {
  if (!args.genKind || !args.genName) {
    console.error("Usage: create-pangza g <controller|service|mapper|entity|all> <name>");
    process.exit(1);
  }
  if (!resolveKind(args.genKind)) {
    console.error(`Unknown type: ${args.genKind}`);
    console.error("Use: controller|service|mapper|entity|all (or c|s|m|e|a)");
    process.exit(1);
  }

  try {
    const { root, results, Pascal } = generate({
      kind: args.genKind,
      name: args.genName,
      force: args.force,
    });

    console.log(`✓ generate ${args.genKind} ${Pascal}  (root: ${root})`);
    for (const r of results) {
      const mark = r.status === "skip" ? "skip" : "write";
      console.log(`  [${mark}] ${r.rel}`);
    }
    if (results.some((r) => r.status === "skip")) {
      console.log("  (已存在文件已跳过；覆盖请加 --force)");
    }
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.cmd) {
    usage();
    process.exit(args.help ? 0 : 1);
  }
  if (args.cmd === "init") {
    await runInit(args);
    return;
  }
  if (args.cmd === "generate") {
    runGenerate(args);
    return;
  }
  usage();
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
