import { getPath } from "../sqlTemplate";
import type { SqlNode } from "./types";

/** 受限 test 表达式求值（禁止任意代码） */
export function evalTest(expr: string, ctx: Record<string, unknown>): boolean {
  const raw = String(expr ?? "").trim();
  if (!raw) return false;

  // 安全：拒绝危险 token
  if (
    /[`$]|__proto__|constructor|Function|require|import|process|global|eval|=>/.test(
      raw
    )
  ) {
    throw new Error(`非法 test 表达式: ${raw}`);
  }

  // a != null / a == null / a != undefined
  let m = raw.match(
    /^([A-Za-z_][\w.]*)\s*(!=|==|=)\s*(null|undefined)$/i
  );
  if (m) {
    const val = getPath(ctx, m[1]);
    const isNull = val === null || val === undefined;
    const op = m[2];
    if (op === "!=") return !isNull;
    return isNull;
  }

  // a.length > 0 / a.length != 0
  m = raw.match(/^([A-Za-z_][\w.]*)\.length\s*(>|>=|==|!=|<=|<)\s*(\d+)$/);
  if (m) {
    const val = getPath(ctx, m[1]);
    const len = Array.isArray(val)
      ? val.length
      : typeof val === "string"
        ? val.length
        : 0;
    return compare(len, m[2], Number(m[3]));
  }

  // a != '' / a == ''
  m = raw.match(/^([A-Za-z_][\w.]*)\s*(!=|==|=)\s*(''|""|"")$/);
  if (m) {
    const val = getPath(ctx, m[1]);
    const empty = val === "" || val === null || val === undefined;
    return m[2] === "!=" ? !empty : empty;
  }

  // a == 1 / a > 0 数字比较
  m = raw.match(/^([A-Za-z_][\w.]*)\s*(==|=|!=|>|>=|<|<=)\s*(-?\d+(?:\.\d+)?)$/);
  if (m) {
    const val = getPath(ctx, m[1]);
    return compare(Number(val), m[2], Number(m[3]));
  }

  // 布尔字面量
  if (/^(true|false)$/i.test(raw)) return /^true$/i.test(raw);

  // 单独属性：truthy
  if (/^[A-Za-z_][\w.]*$/.test(raw)) {
    const val = getPath(ctx, raw);
    if (Array.isArray(val)) return val.length > 0;
    return val !== null && val !== undefined && val !== false && val !== "";
  }

  throw new Error(`不支持的 test 表达式（请用属性比较）: ${raw}`);
}

function compare(left: number, op: string, right: number): boolean {
  switch (op) {
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case "!=":
      return left !== right;
    case "==":
    case "=":
      return left === right;
    default:
      return false;
  }
}

function stripLeadingAndOr(sql: string): string {
  return sql.replace(/^\s*(AND|OR)\s+/i, "").trim();
}

function applyTrim(
  body: string,
  opts: {
    prefix?: string;
    suffix?: string;
    prefixOverrides?: string;
    suffixOverrides?: string;
  }
): string {
  let s = body.trim();
  if (!s) return "";
  if (opts.prefixOverrides) {
    for (const token of opts.prefixOverrides.split("|").map((t) => t.trim())) {
      if (!token) continue;
      const re = new RegExp(`^${escapeRe(token)}\\s+`, "i");
      s = s.replace(re, "");
    }
  }
  if (opts.suffixOverrides) {
    for (const token of opts.suffixOverrides.split("|").map((t) => t.trim())) {
      if (!token) continue;
      const re = new RegExp(`\\s+${escapeRe(token)}$`, "i");
      s = s.replace(re, "");
    }
  }
  s = s.trim();
  if (!s) return "";
  if (opts.prefix) s = `${opts.prefix} ${s}`;
  if (opts.suffix) s = `${s} ${opts.suffix}`;
  return s;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderNodes(
  nodes: SqlNode[],
  ctx: Record<string, unknown>,
  fragments: Map<string, SqlNode[]>,
  stack: string[]
): string {
  let out = "";
  for (const node of nodes) {
    out += renderNode(node, ctx, fragments, stack);
  }
  return out;
}

function renderNode(
  node: SqlNode,
  ctx: Record<string, unknown>,
  fragments: Map<string, SqlNode[]>,
  stack: string[]
): string {
  switch (node.type) {
    case "text":
      return node.text;
    case "if":
      return evalTest(node.test, ctx)
        ? renderNodes(node.children, ctx, fragments, stack)
        : "";
    case "where": {
      const body = stripLeadingAndOr(
        renderNodes(node.children, ctx, fragments, stack).trim()
      );
      return body ? ` WHERE ${body} ` : " ";
    }
    case "set": {
      let body = renderNodes(node.children, ctx, fragments, stack).trim();
      body = body.replace(/,+\s*$/, "").trim();
      return body ? ` SET ${body} ` : " ";
    }
    case "trim": {
      const body = renderNodes(node.children, ctx, fragments, stack);
      const trimmed = applyTrim(body, node);
      return trimmed ? ` ${trimmed} ` : " ";
    }
    case "foreach": {
      const coll = getPath(ctx, node.collection);
      const list = Array.isArray(coll)
        ? coll
        : coll != null && typeof coll === "object"
          ? Object.values(coll as object)
          : [];
      if (!list.length) return "";
      const parts: string[] = [];
      list.forEach((item, idx) => {
        const childCtx: Record<string, unknown> = {
          ...ctx,
          [node.item]: item,
        };
        if (node.index) childCtx[node.index] = idx;
        parts.push(renderNodes(node.children, childCtx, fragments, stack).trim());
      });
      const joined = parts.filter(Boolean).join(node.separator ?? "");
      return `${node.open ?? ""}${joined}${node.close ?? ""}`;
    }
    case "include": {
      if (stack.includes(node.refid)) {
        throw new Error(`<include> 循环引用: ${stack.concat(node.refid).join(" -> ")}`);
      }
      const frag = fragments.get(node.refid);
      if (!frag) throw new Error(`找不到 <sql id="${node.refid}">`);
      return renderNodes(frag, ctx, fragments, [...stack, node.refid]);
    }
    default:
      return "";
  }
}

/** 将语句节点树渲染为带 #{} / ${} 的 SQL 文本 */
export function renderStatementSql(
  nodes: SqlNode[],
  ctx: Record<string, unknown>,
  fragments: Map<string, SqlNode[]> = new Map()
): string {
  return renderNodes(nodes, ctx, fragments, [])
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
