/**
 * MyBatis 风格 SQL 模板：
 * - #{name}  → ? 占位 + 参数绑定（防注入）
 * - ${name}  → 字符串直接替换（仅用于可信标识符等，勿接用户输入）
 * - 支持 #{id, jdbcType=INTEGER} 形式（忽略逗号后选项）
 */

export interface ParsedSql {
  sql: string;
  params: unknown[];
}

const PLACEHOLDER_RE = /([#$])\{([^}]+)\}/g;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof Buffer)
  );
}

/** 从对象取 a.b.c 路径 */
export function getPath(root: unknown, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split(".").map((p) => p.trim()).filter(Boolean);
  let cur: unknown = root;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

/**
 * 从方法实参构建命名参数表（对齐 MyBatis 常用约定）：
 * - @Param("x") 标注的名字
 * - param1 / param2 ...（从 1 起）
 * - arg0 / arg1 ...
 * - 单参数且为对象：展开其字段
 * - 单参数原始值：任意 #{name} 都映射到该值
 */
export function buildParamContext(
  args: unknown[],
  namedByIndex: Record<number, string> = {}
): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};

  args.forEach((arg, i) => {
    ctx[`param${i + 1}`] = arg;
    ctx[`arg${i}`] = arg;
    const named = namedByIndex[i];
    if (named) ctx[named] = arg;
  });

  if (args.length === 1) {
    const only = args[0];
    if (isPlainObject(only)) {
      Object.assign(ctx, only);
    } else {
      ctx.__single__ = only;
    }
  }

  return ctx;
}

function resolveExpr(
  ctx: Record<string, unknown>,
  rawExpr: string
): unknown {
  // #{id, jdbcType=INTEGER} → id
  const key = rawExpr.split(",")[0].trim();
  if (!key) {
    throw new Error("SQL 占位符名不能为空");
  }

  if (Object.prototype.hasOwnProperty.call(ctx, key)) {
    return ctx[key];
  }

  const nested = getPath(ctx, key);
  if (nested !== undefined) {
    return nested;
  }

  if (Object.prototype.hasOwnProperty.call(ctx, "__single__")) {
    return ctx.__single__;
  }

  throw new Error(`[SQL] 找不到参数: ${key}`);
}

/**
 * 解析含 #{} / ${} 的 SQL。
 * 按出现顺序处理；${} 直接拼进 SQL，#{} 变为 ? 并收集 params。
 */
export function parseMybatisSql(
  template: string,
  ctx: Record<string, unknown>
): ParsedSql {
  const params: unknown[] = [];
  const sql = String(template).replace(
    PLACEHOLDER_RE,
    (_whole, kind: string, expr: string) => {
      const value = resolveExpr(ctx, expr);
      if (kind === "$") {
        if (value === undefined || value === null) {
          throw new Error(`[SQL] \${${expr.trim()}} 的值不能为空`);
        }
        return String(value);
      }
      params.push(value);
      return "?";
    }
  );
  return { sql, params };
}

export { isPlainObject };
