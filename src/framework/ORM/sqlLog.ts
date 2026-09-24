import { getLogger } from "@/framework/Logger";
import type { SqlLogFormatFn, SqlLogInfo, SqlLogParts } from "./types";

const log = getLogger("ORM.SQL");

const DEFAULT_FORMAT =
  "{time} [{type}] {cost}ms | {sql} | params={params}";

const DEFAULT_PARTS: Required<SqlLogParts> = {
  time: true,
  type: true,
  sql: true,
  params: true,
  cost: true,
};

export interface SqlLogRuntime {
  enabled: boolean;
  /** 占位符模板，或自定义函数 */
  format: string | SqlLogFormatFn;
  /** 控制输出哪些片段（模板里对应占位符为空时跳过） */
  parts: Required<SqlLogParts>;
  /** pino 级别 */
  level: "trace" | "debug" | "info" | "warn";
}

let runtime: SqlLogRuntime = {
  enabled: false,
  format: DEFAULT_FORMAT,
  parts: { ...DEFAULT_PARTS },
  level: "info",
};

export function getSqlLogRuntime(): SqlLogRuntime {
  return runtime;
}

export function configureSqlLog(
  patch: Partial<{
    enabled: boolean;
    format: string | SqlLogFormatFn;
    parts: SqlLogParts;
    level: SqlLogRuntime["level"];
  }> = {}
): void {
  runtime = {
    enabled: patch.enabled ?? runtime.enabled,
    format: patch.format ?? runtime.format,
    parts: { ...runtime.parts, ...(patch.parts ?? {}) },
    level: patch.level ?? runtime.level,
  };
}

/** 从 SQL 推断类型：SELECT / INSERT / UPDATE / DELETE / OTHER */
export function detectSqlType(sql: string): string {
  const m = String(sql)
    .trim()
    .match(/^(WITH|SELECT|INSERT|UPDATE|DELETE|REPLACE|CALL|SHOW|DESCRIBE|EXPLAIN|SET|BEGIN|COMMIT|ROLLBACK)\b/i);
  if (!m) return "OTHER";
  const raw = m[1].toUpperCase();
  if (raw === "WITH") return "SELECT";
  return raw;
}

function formatTime(date: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.` +
    `${pad(date.getMilliseconds(), 3)}`
  );
}

function safeParams(params: unknown[]): string {
  try {
    return JSON.stringify(params, (_k, v) => {
      if (typeof v === "bigint") return v.toString();
      if (v instanceof Date) return v.toISOString();
      if (Buffer.isBuffer(v)) return `<Buffer ${v.length}b>`;
      return v;
    });
  } catch {
    return String(params);
  }
}

function compactSql(sql: string): string {
  return String(sql).replace(/\s+/g, " ").trim();
}

function applyParts(
  info: SqlLogInfo,
  parts: Required<SqlLogParts>
): Record<string, string> {
  return {
    time: parts.time ? info.time : "",
    type: parts.type ? info.type : "",
    sql: parts.sql ? info.sql : "",
    params: parts.params ? info.paramsText : "",
    cost: parts.cost ? String(info.cost) : "",
  };
}

/**
 * 默认模板替换。
 * 占位符：{time} {type} {sql} {params} {cost}
 * 若某 part 关闭，对应占位符替换为空，并清理多余分隔符。
 */
export function renderSqlLog(
  info: SqlLogInfo,
  format: string | SqlLogFormatFn = runtime.format,
  parts: Required<SqlLogParts> = runtime.parts
): string {
  if (typeof format === "function") {
    return format(info);
  }

  const values = applyParts(info, parts);
  let out = String(format).replace(
    /\{(time|type|sql|params|cost)\}/g,
    (_m, key: keyof typeof values) => values[key] ?? ""
  );

  // 清理因关闭某段产生的空标签 / 多余分隔
  out = out
    .replace(/\bparams=\s*(?=\||$)/gi, "")
    .replace(/\s*\|\s*\|/g, " |")
    .replace(/\[\s*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\|/g, " |")
    .replace(/\|\s+/g, "| ")
    .replace(/^\s*\|\s*/, "")
    .replace(/\s*\|\s*$/, "")
    .trim();

  // 默认模板 `{cost}ms`：cost 关闭时去掉孤立 ms
  if (!parts.cost) {
    out = out
      .replace(/(^|\|\s*)ms(\s*\||$)/g, "$1$2")
      .replace(/\s+ms$/g, "")
      .replace(/\s*\|\s*\|/g, " |")
      .replace(/^\s*\|\s*/, "")
      .replace(/\s*\|\s*$/, "")
      .trim();
  }

  return out;
}

/** 执行前后包装：记录耗时并按配置输出 */
export async function withSqlLog<T>(
  sql: string,
  params: unknown[],
  run: () => Promise<T>
): Promise<T> {
  if (!runtime.enabled) {
    return run();
  }

  const startedAt = Date.now();
  const startDate = new Date(startedAt);
  try {
    const result = await run();
    const cost = Date.now() - startedAt;
    const info: SqlLogInfo = {
      time: formatTime(startDate),
      type: detectSqlType(sql),
      sql: compactSql(sql),
      params,
      paramsText: safeParams(params),
      cost,
      error: false,
    };
    const message = renderSqlLog(info);
    // 结构化字段 + 消息，避免仅依赖 msg 在部分终端丢编码
    log[runtime.level](
      {
        sqlType: info.type,
        cost: info.cost,
        sql: info.sql,
        params: info.params,
      },
      message
    );
    return result;
  } catch (err) {
    const cost = Date.now() - startedAt;
    const info: SqlLogInfo = {
      time: formatTime(startDate),
      type: detectSqlType(sql),
      sql: compactSql(sql),
      params,
      paramsText: safeParams(params),
      cost,
      error: true,
    };
    const message = renderSqlLog(info);
    log.error(
      {
        err,
        sqlType: info.type,
        cost: info.cost,
        sql: info.sql,
        params: info.params,
      },
      message
    );
    throw err;
  }
}

export { DEFAULT_FORMAT as DEFAULT_SQL_LOG_FORMAT };
