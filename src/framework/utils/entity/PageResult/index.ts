/** 与 Java PageResult 对齐的分页响应 */
export interface PageResult<T> {
  total: number;
  list: T[];
  pageNum: number;
  pageSize: number;
  pages: number;
}

/** Vue / Java 共用的分页请求体 */
export interface PageRequest<T = Record<string, unknown>> {
  pageNum?: number;
  pageSize?: number;
  sorter?: Array<Record<string, string>>;
  form?: T;
}

/** 将 ORM IPage 转为 PageResult */
export function toPageResult<T>(page: {
  records: T[];
  total: number;
  current: number;
  size: number;
}): PageResult<T> {
  const pageSize = page.size || 10;
  const total = page.total || 0;
  return {
    total,
    list: page.records ?? [],
    pageNum: page.current || 1,
    pageSize,
    pages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  };
}
