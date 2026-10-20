import fs from "fs";
import path from "path";
import yaml from "js-yaml";

type Plain = Record<string, unknown>;

interface DatasourceYaml {
  type?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  connectionLimit?: number;
  /** false 时不自动注册；缺省且 host 非空则注册 */
  enabled?: boolean;
}

interface AppYaml {
  server?: { port?: number };
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  upload?: { path?: string; urlPrefix?: string };
  datasource?: {
    default?: DatasourceYaml;
    postgresql?: DatasourceYaml;
    sqlserver?: DatasourceYaml;
  };
  orm?: {
    logicDelete?: boolean;
    logicDeleteField?: string;
    logicDeleteValue?: unknown;
    logicNotDeleteValue?: unknown;
    optimisticLock?: boolean;
    versionField?: string;
    idType?: string;
    mapUnderscoreToCamelCase?: boolean;
    workerId?: number;
    fill?: {
      createTime?: string;
      updateTime?: string;
      createBy?: string;
      updateBy?: string;
    };
    sqlLog?: {
      enabled?: boolean;
      format?: string;
      level?: string;
      parts?: {
        time?: boolean;
        type?: boolean;
        sql?: boolean;
        params?: boolean;
        cost?: boolean;
      };
    };
  };
}

const PROFILE_ALIAS: Record<string, string> = {
  dev: "development",
  development: "development",
  prod: "production",
  production: "production",
  test: "test",
};

function isPlain(value: unknown): value is Plain {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base: Plain, over: Plain): Plain {
  const out: Plain = { ...base };
  for (const [key, value] of Object.entries(over)) {
    if (value === undefined) continue;
    if (isPlain(value) && isPlain(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function readYamlFile(file: string): Plain {
  if (!fs.existsSync(file)) return {};
  const doc = yaml.load(fs.readFileSync(file, "utf8"));
  if (doc == null) return {};
  if (!isPlain(doc)) {
    throw new Error(`配置文件必须是 YAML 对象: ${file}`);
  }
  return doc;
}

function resolveProfile(): string {
  const raw = (
    process.env.PANGZA_PROFILE ||
    process.env.APP_ENV ||
    process.env.NODE_ENV ||
    "development"
  ).trim();
  const key = raw.toLowerCase();
  return PROFILE_ALIAS[key] ?? key;
}

/** `--config <path>` / `--config=<path>`，否则 `CONFIG_PATH` */
function externalConfigPath(): string | undefined {
  const argv = process.argv;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--config" && argv[i + 1]) return argv[i + 1];
    if (arg.startsWith("--config=")) {
      const value = arg.slice("--config=".length).trim();
      if (value) return value;
    }
  }
  const fromEnv = process.env.CONFIG_PATH?.trim();
  return fromEnv || undefined;
}

function loadAppYaml(): { config: AppYaml; profile: string; files: string[] } {
  const root = process.cwd();
  const profile = resolveProfile();
  const files = [
    path.join(root, "application.yaml"),
    path.join(root, `application-${profile}.yaml`),
  ];
  const external = externalConfigPath();
  if (external) {
    const resolved = path.resolve(root, external);
    if (!fs.existsSync(resolved)) {
      throw new Error(`指定的配置文件不存在: ${resolved}`);
    }
    files.push(resolved);
  }
  if (!fs.existsSync(files[0])) {
    throw new Error(`缺少基础配置: ${files[0]}`);
  }
  let merged: Plain = {};
  const loaded: string[] = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    merged = deepMerge(merged, readYamlFile(file));
    loaded.push(file);
  }
  return { config: merged as AppYaml, profile, files: loaded };
}

const loaded = loadAppYaml();
const appYaml = loaded.config;

/** 当前环境名（development / production / test，或自定义） */
export const configProfile = loaded.profile;

/** 实际读入的配置文件（后者覆盖前者） */
export const configFiles = loaded.files;

function asString(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function asInt(value: unknown, fallback: number): number {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  if (value == null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = String(value).toLowerCase();
  return text === "1" || text === "true";
}

function defaultDbPort(type: string): number {
  if (type === "postgresql") return 5432;
  if (type === "sqlserver") return 1433;
  return 3306;
}

function mapDatasource(
  raw: DatasourceYaml | undefined,
  defaults: { type: string; user: string; database: string; port?: number }
): {
  type: string;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  enabled: boolean;
} {
  const type = asString(raw?.type, defaults.type) || defaults.type;
  const host = asString(raw?.host, "");
  const enabled = raw?.enabled === false ? false : host !== "";
  return {
    type,
    host,
    port: asInt(raw?.port, defaults.port ?? defaultDbPort(type)),
    user: asString(raw?.user, defaults.user),
    password: asString(raw?.password, ""),
    database: asString(raw?.database, defaults.database),
    connectionLimit: asInt(raw?.connectionLimit, 10),
    enabled,
  };
}

const defaultDs = mapDatasource(appYaml.datasource?.default, {
  type: "mysql",
  user: "root",
  database: "pangza",
  port: undefined,
});

/** 服务端口 */
export const PORT = asInt(appYaml.server?.port, 3990);

/** Redis 配置 */
export const redisConfig = {
  host: asString(appYaml.redis?.host, "127.0.0.1"),
  port: asInt(appYaml.redis?.port, 6379),
  password: asString(appYaml.redis?.password, ""),
  db: asInt(appYaml.redis?.db, 0),
  keyPrefix: asString(appYaml.redis?.keyPrefix, "pangza:"),
};

/**
 * 默认数据源（项目根目录 application*.yaml 的 datasource.default）。
 * host 为空时仍注册 default，使用默认主机 127.0.0.1。
 */
export const mysqlConfig = {
  type: defaultDs.type || "mysql",
  host: defaultDs.host || "127.0.0.1",
  port: defaultDs.port,
  user: defaultDs.user,
  password: defaultDs.password,
  database: defaultDs.database,
  connectionLimit: defaultDs.connectionLimit,
};

const pgDs = mapDatasource(appYaml.datasource?.postgresql, {
  type: "postgresql",
  user: "postgres",
  database: "pangza",
  port: 5432,
});

/** PostgreSQL 附加数据源（host 非空且未 enabled: false 时注册为 "postgresql"） */
export const postgresqlConfig = {
  host: pgDs.enabled ? pgDs.host : "",
  port: pgDs.port,
  user: pgDs.user,
  password: pgDs.password,
  database: pgDs.database,
  connectionLimit: pgDs.connectionLimit,
};

const mssqlDs = mapDatasource(appYaml.datasource?.sqlserver, {
  type: "sqlserver",
  user: "sa",
  database: "pangza",
  port: 1433,
});

/** SQL Server 附加数据源（host 非空且未 enabled: false 时注册为 "sqlserver"） */
export const mssqlConfig = {
  host: mssqlDs.enabled ? mssqlDs.host : "",
  port: mssqlDs.port,
  user: mssqlDs.user,
  password: mssqlDs.password,
  database: mssqlDs.database,
  connectionLimit: mssqlDs.connectionLimit,
};

/** 上传目录（相对路径相对项目根目录） */
export const UPLOAD_PATH = (() => {
  const raw = asString(appYaml.upload?.path, "");
  if (!raw) return path.resolve(process.cwd(), "upload");
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
})();

/** 上传访问前缀 */
export const UPLOAD_URL_PREFIX = asString(appYaml.upload?.urlPrefix, "/files");

const orm = appYaml.orm ?? {};
const sqlLog = orm.sqlLog ?? {};
const sqlParts = sqlLog.parts ?? {};

/** ORM 默认配置（逻辑删除 / 乐观锁 / 自动填充字段名） */
export const ormEnvConfig = {
  logicDelete: asBool(orm.logicDelete, true),
  logicDeleteField: asString(orm.logicDeleteField, "delete_flag"),
  logicDeleteValue: orm.logicDeleteValue ?? 1,
  logicNotDeleteValue: orm.logicNotDeleteValue ?? 0,
  optimisticLock: asBool(orm.optimisticLock, false),
  versionField: asString(orm.versionField, "version"),
  /** 全局主键策略：AUTO | NONE | INPUT | ASSIGN_ID | ASSIGN_UUID */
  idType: asString(orm.idType, "ASSIGN_ID"),
  mapUnderscoreToCamelCase: asBool(orm.mapUnderscoreToCamelCase, true),
  workerId: asInt(orm.workerId, 1),
  fillCreateTime: asString(orm.fill?.createTime, "create_time"),
  fillUpdateTime: asString(orm.fill?.updateTime, "update_time"),
  fillCreateBy: asString(orm.fill?.createBy, "create_by"),
  fillUpdateBy: asString(orm.fill?.updateBy, "update_by"),
  sqlLog: asBool(sqlLog.enabled, false),
  sqlLogFormat: asString(
    sqlLog.format,
    "{time} [{type}] {cost}ms | {sql} | params={params}"
  ),
  sqlLogParts: {
    time: asBool(sqlParts.time, true),
    type: asBool(sqlParts.type, true),
    sql: asBool(sqlParts.sql, true),
    params: asBool(sqlParts.params, true),
    cost: asBool(sqlParts.cost, true),
  },
  sqlLogLevel: (asString(sqlLog.level, "info") || "info") as
    | "trace"
    | "debug"
    | "info"
    | "warn",
};

console.info(
  `[config] profile=${configProfile} files=${configFiles
    .map((file) => path.relative(process.cwd(), file) || file)
    .join(", ")}`
);
