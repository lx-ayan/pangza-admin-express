import path from "path";
import dotenv from "dotenv";

// 从项目根目录加载 .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
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
