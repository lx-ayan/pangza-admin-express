"use strict";

/** 可选能力模块（当前均由单包 @pangza/express 提供，差异在依赖与脚手架文件） */
const MODULES = [
  {
    id: "orm",
    label: "ORM",
    hint: "Db / Mapper / QueryWrapper / 多数据源",
  },
  {
    id: "auth",
    label: "Auth",
    hint: "登录态、角色权限装饰器（建议同时选 Redis）",
  },
  {
    id: "redis",
    label: "Redis",
    hint: "缓存、限流、Auth token 存储",
  },
  {
    id: "log",
    label: "Log",
    hint: "操作审计日志装饰器",
  },
  {
    id: "schedule",
    label: "Schedule",
    hint: "定时任务 (cron)",
  },
  {
    id: "encrypt",
    label: "Encrypt",
    hint: "AES 等传输加密工具",
  },
  {
    id: "validate",
    label: "Validate",
    hint: "参数校验装饰器",
  },
];

const DB_CHOICES = [
  { value: "mysql", label: "MySQL (mysql2)" },
  { value: "postgresql", label: "PostgreSQL (pg)" },
  { value: "mssql", label: "SQL Server (mssql)" },
];

const DB_DEPS = {
  mysql: { mysql2: "^3.24.4" },
  postgresql: { pg: "^8.23.1" },
  mssql: { mssql: "^12.7.9" },
};

const DB_ENV = {
  mysql: [
    "DB_TYPE=mysql",
    "MYSQL_HOST=127.0.0.1",
    "MYSQL_PORT=3306",
    "MYSQL_USER=root",
    "MYSQL_PASSWORD=",
    "MYSQL_DATABASE=pangza",
  ],
  postgresql: [
    "DB_TYPE=postgresql",
    "PG_HOST=127.0.0.1",
    "PG_PORT=5432",
    "PG_USER=postgres",
    "PG_PASSWORD=",
    "PG_DATABASE=pangza",
  ],
  mssql: [
    "DB_TYPE=mssql",
    "MSSQL_HOST=127.0.0.1",
    "MSSQL_PORT=1433",
    "MSSQL_USER=sa",
    "MSSQL_PASSWORD=",
    "MSSQL_DATABASE=pangza",
  ],
};

/** @param {string[]} moduleIds @param {string} [dbType] */
function resolveDependencies(moduleIds, dbType = "mysql") {
  const deps = {
    "@pangza/express": "^1.0.1",
    cors: "^2.8.5",
    express: "^5.2.1",
    inversify: "^8.2.3",
    "reflect-metadata": "^0.2.2",
  };
  const set = new Set(moduleIds);

  if (set.has("orm")) {
    Object.assign(deps, DB_DEPS[dbType] || DB_DEPS.mysql);
  }
  if (set.has("redis") || set.has("auth")) {
    deps.redis = "^6.2.1";
  }
  if (set.has("auth")) {
    deps.jsonwebtoken = "^9.0.3";
    deps.bcryptjs = "^3.0.3";
  }
  if (set.has("schedule")) {
    deps["node-cron"] = "^4.6.0";
  }

  return deps;
}

/** @param {string[]} moduleIds @param {string} [dbType] */
function resolveEnvLines(moduleIds, dbType = "mysql") {
  const lines = ["PORT=5270"];
  const set = new Set(moduleIds);

  if (set.has("orm")) {
    lines.push("", "# Database", ...(DB_ENV[dbType] || DB_ENV.mysql));
  }
  if (set.has("redis") || set.has("auth")) {
    lines.push(
      "",
      "# Redis",
      "REDIS_HOST=127.0.0.1",
      "REDIS_PORT=6379",
      "REDIS_PASSWORD=",
    );
  }
  if (set.has("auth")) {
    lines.push("", "# Auth", "JWT_SECRET=change-me");
  }
  return lines;
}

/** @param {string[]} moduleIds */
function resolveDirs(moduleIds) {
  const dirs = ["src"];
  const set = new Set(moduleIds);
  if (set.has("orm")) {
    dirs.push("src/entity", "src/mapper", "src/service", "src/controller");
  } else {
    dirs.push("src/controller");
  }
  if (set.has("schedule")) dirs.push("src/schedule");
  return dirs;
}

/**
 * 生成空项目入口：只起 HTTP；选了 redis/orm 才 Enable*，否则启动不连库。
 * @param {string[]} moduleIds
 */
function generateMainTs(moduleIds) {
  const set = new Set(moduleIds);
  const named = ["Application", "Logger"];
  if (set.has("orm")) named.push("EnableOrm");
  if (set.has("redis") || set.has("auth")) named.push("EnableRedis");
  if (set.has("auth")) named.push("Auth", "Redis");
  if (set.has("log")) named.push("Log");

  const imports = [
    'import "reflect-metadata";',
    'import cors from "cors";',
    'import { json } from "express";',
    `import { ${named.join(", ")} } from "@pangza/express";`,
  ];

  const notes = [];
  if (set.has("schedule")) {
    notes.push("// Schedule: 在 src/schedule 编写任务并由扫描加载");
  }
  if (set.has("encrypt")) {
    notes.push("// Encrypt: 从 @pangza/express 导入 AESUtil 等");
  }
  if (set.has("validate")) {
    notes.push("// Validate: 在 Controller 参数上使用校验装饰器");
  }

  const chain = [
    'Application.registry(Logger({ level: "info" }))',
    "  .registry(cors())",
    "  .registry(json())",
  ];
  if (set.has("orm")) {
    chain.push("  .registry(EnableOrm())");
  }
  if (set.has("redis") || set.has("auth")) {
    chain.push("  .registry(EnableRedis())");
  }
  if (set.has("auth")) {
    chain.push(
      '  .registry(Auth({ ignore: ["/api/pub/**"], redis: Redis }))',
    );
  }
  if (set.has("log")) {
    chain.push("  .registry(Log())");
  }
  chain.push('  .scan("src")');
  chain.push("  .start();");

  return [
    ...imports,
    "",
    ...(notes.length ? [...notes, ""] : []),
    ...chain,
    "",
  ].join("\n");
}

module.exports = {
  MODULES,
  DB_CHOICES,
  resolveDependencies,
  resolveEnvLines,
  resolveDirs,
  generateMainTs,
};
