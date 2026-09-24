import type { QueryWrapper } from "@/framework/ORM";
import type { IPage, PageQuery } from "@/framework/ORM";
import type { IService } from "./types";

function notWired(name: string): never {
  throw new Error(`[Mapper] 方法未注入，请使用 @Mapper(table): ${name}`);
}

/**
 * Mapper 类型基类：提供与 ORM BaseMapper 对齐的方法签名。
 * 实际实现由 @Mapper(table) 覆盖原型方法。
 */
export class MapperType<T extends Record<string, any> = Record<string, any>>
  implements IService<T>
{
  selectById(_id: string | number): Promise<T | null> {
    return notWired("selectById");
  }
  selectOne(_wrapper?: QueryWrapper): Promise<T | null> {
    return notWired("selectOne");
  }
  selectList(_wrapper?: QueryWrapper, _limit?: number): Promise<T[]> {
    return notWired("selectList");
  }
  selectCount(_wrapper?: QueryWrapper): Promise<number> {
    return notWired("selectCount");
  }
  selectPage(
    _page?: PageQuery,
    _wrapper?: QueryWrapper
  ): Promise<IPage<T>> {
    return notWired("selectPage");
  }
  insert(_entity: Partial<T>): Promise<number> {
    return notWired("insert");
  }
  saveBatch(_entities: Array<Partial<T>>): Promise<number> {
    return notWired("saveBatch");
  }
  updateById(_entity: Partial<T>): Promise<number> {
    return notWired("updateById");
  }
  update(_entity: Partial<T>, _wrapper: QueryWrapper): Promise<number> {
    return notWired("update");
  }
  deleteById(_id: string | number): Promise<number> {
    return notWired("deleteById");
  }
  deleteByIds(_ids: Array<string | number>): Promise<number> {
    return notWired("deleteByIds");
  }
  delete(_wrapper: QueryWrapper): Promise<number> {
    return notWired("delete");
  }
}
