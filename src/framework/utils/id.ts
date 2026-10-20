import { getIdentifierGenerator } from "@/framework/ORM/identifier";

/**
 * @deprecated 请用实体 `@TableId({ type: IdType.ASSIGN_ID })`（全局默认已是 ASSIGN_ID），
 * insert 时自动生成；或 `getIdentifierGenerator().nextId()`。
 */
export function nextId(): string {
  const id = getIdentifierGenerator().nextId();
  return typeof id === "string" ? id : String(id);
}
