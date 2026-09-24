import path from "path";
import dotenv from "dotenv";

// 从项目根目录加载 .env（覆盖已有环境变量，保证改 ORM 开关后重启生效）
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  override: true,
});

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw == null || raw === "") return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

function envValue(raw: string): unknown {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw !== "" && !Number.isNaN(Number(raw))) return Number(raw);
  return raw;
}

/** 服务端口 */
export const PORT = envInt("PORT", 3990);

/** Redis 配置（来自 .env） */
export const redisConfig = {
  host: env("REDIS_HOST", "127.0.0.1"),
  port: envInt("REDIS_PORT", 6379),
  password: env("REDIS_PASSWORD", ""),
  db: envInt("REDIS_DB", 0),
  keyPrefix: env("REDIS_KEY_PREFIX", "pangza:"),
};

/** MySQL 配置（来自 .env） */
export const mysqlConfig = {
  host: env("MYSQL_HOST", "127.0.0.1"),
  port: envInt("MYSQL_PORT", 3306),
  user: env("MYSQL_USER", "root"),
  password: env("MYSQL_PASSWORD", ""),
  database: env("MYSQL_DATABASE", "pangza"),
  connectionLimit: envInt("MYSQL_CONNECTION_LIMIT", 10),
};

/** 上传目录（对齐 Java pangza.upload.path） */
export const UPLOAD_PATH = env(
  "UPLOAD_PATH",
  path.resolve(process.cwd(), "upload")
);

/** 上传访问前缀（对齐 Java pangza.upload.url-prefix） */
export const UPLOAD_URL_PREFIX = env("UPLOAD_URL_PREFIX", "/files");

/** ORM 二期默认配置（逻辑删除 / 乐观锁 / 自动填充字段名） */
export const ormEnvConfig = {
  logicDelete: envBool("ORM_LOGIC_DELETE", false),
  logicDeleteField: env("ORM_LOGIC_DELETE_FIELD", "delete_flag"),
  logicDeleteValue: envValue(env("ORM_LOGIC_DELETE_VALUE", "1")),
  logicNotDeleteValue: envValue(env("ORM_LOGIC_NOT_DELETE_VALUE", "0")),
  optimisticLock: envBool("ORM_OPTIMISTIC_LOCK", false),
  versionField: env("ORM_VERSION_FIELD", "version"),
  fillCreateTime: env("ORM_FILL_CREATE_TIME", "create_time"),
  fillUpdateTime: env("ORM_FILL_UPDATE_TIME", "update_time"),
  fillCreateBy: env("ORM_FILL_CREATE_BY", "create_by"),
  fillUpdateBy: env("ORM_FILL_UPDATE_BY", "update_by"),
  /** 是否打印 SQL 日志 */
  sqlLog: envBool("ORM_SQL_LOG", false),
  /**
   * SQL 日志格式模板，占位符：{time} {type} {sql} {params} {cost}
   * 例：{time} [{type}] {cost}ms | {sql} | params={params}
   */
  sqlLogFormat: env(
    "ORM_SQL_LOG_FORMAT",
    "{time} [{type}] {cost}ms | {sql} | params={params}"
  ),
  sqlLogParts: {
    time: envBool("ORM_SQL_LOG_TIME", true),
    type: envBool("ORM_SQL_LOG_TYPE", true),
    sql: envBool("ORM_SQL_LOG_SQL", true),
    params: envBool("ORM_SQL_LOG_PARAMS", true),
    cost: envBool("ORM_SQL_LOG_COST", true),
  },
  sqlLogLevel: (env("ORM_SQL_LOG_LEVEL", "info") || "info") as
    | "trace"
    | "debug"
    | "info"
    | "warn",
};
