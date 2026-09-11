export { Db };
export { BaseMapper } from "./BaseMapper";
export { QueryWrapper, assertIdent } from "./QueryWrapper";
export {
  assertSafeUint,
  escapeLike,
  assertSafeLastSql,
} from "./security";
export type {
  MysqlConfig,
  MapperOptions,
  PageQuery,
  IPage,
  SqlFragment,
} from "./types";

// 按 .env 自动连接（失败仅打日志，首次 query 会再试）
void Db.connect().catch((err: Error) => {
  console.error("[MySQL] 自动连接失败:", err.message);
});

export default Db;
