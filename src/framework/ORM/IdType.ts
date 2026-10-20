/**
 * 主键生成策略（对齐 MyBatis-Plus IdType）
 *
 * @example
 * @TableId({ type: IdType.ASSIGN_ID })
 * id!: string;
 */
export enum IdType {
  /** 数据库自增（不向 INSERT 写入 id，插入后回填） */
  AUTO = "AUTO",
  /** 未设置：跟随全局 configureOrm / ORM_ID_TYPE */
  NONE = "NONE",
  /** 插入前自行赋值，框架不生成 */
  INPUT = "INPUT",
  /** 雪花算法分配（空才生成），适合 number / string */
  ASSIGN_ID = "ASSIGN_ID",
  /** UUID（去横线）分配，适合 string */
  ASSIGN_UUID = "ASSIGN_UUID",
}

export type IdTypeValue = IdType | keyof typeof IdType | string;

export function resolveIdType(value?: IdTypeValue | null): IdType {
  if (value == null || value === "") return IdType.NONE;
  const key = String(value).toUpperCase();
  if (key in IdType) {
    return IdType[key as keyof typeof IdType];
  }
  throw new Error(`不支持的 IdType: ${value}`);
}
