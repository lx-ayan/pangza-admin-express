import type { QueryWrapper } from "@/framework/ORM";
import type { IPage, PageQuery } from "@/framework/ORM";

/**
 * Service 基础能力（对齐 MyBatis-Plus IService，精简版）。
 * 由 @Service(Mapper) 混入到 Service 类原型上。
 */
export interface IService<T extends Record<string, any> = Record<string, any>> {
  selectById(id: string | number): Promise<T | null>;
  selectOne(wrapper?: QueryWrapper): Promise<T | null>;
  selectList(wrapper?: QueryWrapper, limit?: number): Promise<T[]>;
  selectCount(wrapper?: QueryWrapper): Promise<number>;
  selectPage(page?: PageQuery, wrapper?: QueryWrapper): Promise<IPage<T>>;
  insert(entity: Partial<T>): Promise<number>;
  saveBatch(entities: Array<Partial<T>>): Promise<number>;
  updateById(entity: Partial<T>): Promise<number>;
  update(entity: Partial<T>, wrapper: QueryWrapper): Promise<number>;
  deleteById(id: string | number): Promise<number>;
  deleteByIds(ids: Array<string | number>): Promise<number>;
  delete(wrapper: QueryWrapper): Promise<number>;
}

/** BaseMapper 需委托到 Service 的方法名 */
export const MAPPER_DELEGATE_METHODS = [
  "selectById",
  "selectOne",
  "selectList",
  "selectCount",
  "selectPage",
  "insert",
  "saveBatch",
  "updateById",
  "update",
  "deleteById",
  "deleteByIds",
  "delete",
] as const;

export type MapperDelegateMethod = (typeof MAPPER_DELEGATE_METHODS)[number];
