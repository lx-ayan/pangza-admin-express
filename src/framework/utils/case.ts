/** snake_case → camelCase */
export function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** 将行对象键名转为 camelCase（递归处理一层数组/对象） */
export function rowToCamel<T = Record<string, unknown>>(
  row: Record<string, unknown> | null | undefined
): T | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[snakeToCamel(k)] = v;
  }
  return out as T;
}

export function rowsToCamel<T = Record<string, unknown>>(
  rows: Record<string, unknown>[]
): T[] {
  return rows.map((r) => rowToCamel<T>(r)!);
}

/** 去掉 password 字段 */
export function omitPassword<T extends Record<string, unknown>>(
  row: T | null
): T | null {
  if (!row) return null;
  const { password: _p, ...rest } = row as T & { password?: unknown };
  return rest as T;
}
