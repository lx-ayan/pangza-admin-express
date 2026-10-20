import { executeXmlStatement } from "./execute";
import { ensureXmlMappersLoaded } from "./loadMappers";
import { getXmlStatement } from "./registry";

export interface XmlMapperApi {
  selectList(id: string, params?: Record<string, unknown>): Promise<unknown[]>;
  selectOne(
    id: string,
    params?: Record<string, unknown>
  ): Promise<unknown | null>;
  insert(id: string, params?: Record<string, unknown>): Promise<number>;
  update(id: string, params?: Record<string, unknown>): Promise<number>;
  delete(id: string, params?: Record<string, unknown>): Promise<number>;
  /** 按 kind 执行任意语句 */
  execute(id: string, params?: Record<string, unknown>): Promise<unknown>;
}

/**
 * 无类调用 XML 命名空间。
 * @example
 * await xmlMapper("com.pangza.UserMapper").selectList("findByRole", { roleId: 1 })
 */
export function xmlMapper(
  namespace: string,
  datasource?: string
): XmlMapperApi {
  const ns = String(namespace ?? "").trim();
  if (!ns) throw new Error("xmlMapper namespace 不能为空");

  const run = async (id: string, params?: Record<string, unknown>) => {
    ensureXmlMappersLoaded();
    const stmt = getXmlStatement(ns, id);
    if (!stmt) throw new Error(`未找到 XML 语句 ${ns}.${id}`);
    return executeXmlStatement(ns, id, {
      paramObject: params ?? {},
      datasource,
    });
  };

  return {
    async selectList(id, params) {
      const rows = await run(id, params);
      return (Array.isArray(rows) ? rows : []) as unknown[];
    },
    async selectOne(id, params) {
      const rows = await this.selectList(id, params);
      return rows[0] ?? null;
    },
    async insert(id, params) {
      return Number(await run(id, params));
    },
    async update(id, params) {
      return Number(await run(id, params));
    },
    async delete(id, params) {
      return Number(await run(id, params));
    },
    execute(id, params) {
      return run(id, params);
    },
  };
}
