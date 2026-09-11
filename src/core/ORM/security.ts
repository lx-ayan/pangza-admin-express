/**
 * ORM SQL 安全工具：标识符白名单、整数校验、LIKE 转义。
 * 值参数一律走 ? 占位，禁止拼接用户输入到 SQL 结构中。
 */

const IDENT_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const FORBIDDEN_IDENTS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

/** 校验表名/列名，防止标识符注入 */
export function assertIdent(name: string): string {
  if (typeof name !== "string" || !IDENT_RE.test(name) || FORBIDDEN_IDENTS.has(name)) {
    throw new Error(`非法标识符: ${String(name)}`);
  }
  return name;
}

/** 校验非负安全整数（用于 LIMIT / OFFSET / 页码） */
export function assertSafeUint(value: unknown, label = "number"): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) {
    throw new Error(`非法整数参数 ${label}: ${String(value)}`);
  }
  return n;
}

/** 转义 LIKE 通配符，避免用户输入 %/_ 扩大匹配面 */
export function escapeLike(value: string): string {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

/**
 * 校验 last() 仅允许白名单安全片段。
 * 禁止任意原生 SQL 拼接，降低注入风险。
 */
export function assertSafeLastSql(sql: string): string {
  const trimmed = String(sql).trim().replace(/\s+/g, " ");
  if (
    !/^(LIMIT\s+\d+(\s+OFFSET\s+\d+)?|FOR UPDATE|LOCK IN SHARE MODE)$/i.test(
      trimmed
    )
  ) {
    throw new Error(
      "last() 仅允许: LIMIT n [OFFSET m] / FOR UPDATE / LOCK IN SHARE MODE"
    );
  }
  return trimmed;
}
