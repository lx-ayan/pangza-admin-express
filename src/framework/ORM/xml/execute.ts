import Db, { type RowDataPacket } from "../Db";
import { mapResultRows } from "../resultMap";
import { buildParamContext, parseMybatisSql } from "../sqlTemplate";
import { getXmlFragments, getXmlStatement } from "./registry";
import { renderStatementSql } from "./renderSql";
import type { XmlStatement } from "./types";

export interface ExecuteXmlOptions {
  datasource?: string;
  /** 直接传入命名参数对象（xmlMapper 用）；与 args 二选一优先 paramObject */
  paramObject?: Record<string, unknown>;
  args?: unknown[];
  namedByIndex?: Record<number, string>;
}

function resolveDatasource(stmt: XmlStatement, override?: string): string {
  if (override?.trim()) return override.trim();
  if (stmt.datasource?.trim()) return stmt.datasource.trim();
  return "default";
}

/** 渲染并执行已注册的 XML 语句 */
export async function executeXmlStatement(
  namespace: string,
  id: string,
  options: ExecuteXmlOptions = {}
): Promise<unknown> {
  const stmt = getXmlStatement(namespace, id);
  if (!stmt) {
    throw new Error(`未找到 XML 语句 ${namespace}.${id}`);
  }
  return executeParsedStatement(stmt, options);
}

export async function executeParsedStatement(
  stmt: XmlStatement,
  options: ExecuteXmlOptions = {}
): Promise<unknown> {
  const ctx =
    options.paramObject ??
    buildParamContext(options.args ?? [], options.namedByIndex ?? {});
  const fragments = getXmlFragments(stmt.namespace);
  const template = renderStatementSql(stmt.nodes, ctx, fragments);
  if (!template) {
    throw new Error(
      `XML 语句 ${stmt.namespace}.${stmt.id} 渲染结果为空（file=${stmt.sourceFile ?? "?"})`
    );
  }
  const parsed = parseMybatisSql(template, ctx);
  const datasource = resolveDatasource(stmt, options.datasource);
  const result = await Db.queryOn(datasource, parsed.sql, parsed.params);

  if (stmt.kind === "select") {
    return mapResultRows((result as RowDataPacket[]) ?? []) as RowDataPacket[];
  }

  const dialect = Db.getDialect(datasource);
  if (stmt.kind === "insert") {
    if (Array.isArray(result) && result[0] && typeof result[0] === "object") {
      const row = result[0] as Record<string, unknown>;
      const first = Object.values(row)[0];
      if (first != null) return Number(first);
    }
    return dialect.extractInsertId(result, "id", false);
  }
  return dialect.extractAffectedRows(result);
}
