import { rowToCamel, rowsToCamel } from "@/framework/utils/case";
import { getOrmConfig } from "./config";

/**
 * 查询结果键名映射（对齐 MyBatis mapUnderscoreToCamelCase）。
 * 默认开启：create_time → createTime。
 */
export function mapResultRow<T extends Record<string, any>>(
  row: T | null | undefined
): T | null {
  if (!row) return null;
  if (!getOrmConfig().mapUnderscoreToCamelCase) return row;
  return rowToCamel<T>(row as Record<string, unknown>)!;
}

export function mapResultRows<T extends Record<string, any>>(rows: T[]): T[] {
  if (!rows?.length) return rows ?? [];
  if (!getOrmConfig().mapUnderscoreToCamelCase) return rows;
  return rowsToCamel<T>(rows as Record<string, unknown>[]);
}
