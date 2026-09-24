/**
 * 业务类型（入库为字符串序数）
 * CREATE=0 … LOGIN=8 … OTHER=9
 */
export const BusinessType = {
  CREATE: 0,
  UPDATE: 1,
  DELETE: 2,
  READ: 3,
  LIST: 4,
  UPLOAD: 5,
  EXPORT: 6,
  IMPORT: 7,
  LOGIN: 8,
  OTHER: 9,
} as const;

export type BusinessTypeValue = (typeof BusinessType)[keyof typeof BusinessType];

/** 操作端 */
export const OperType = {
  MOBILE: 0,
  PC: 1,
  OTHER: 2,
} as const;

export type OperTypeValue = (typeof OperType)[keyof typeof OperType];

/** 路由 / 装饰器上的日志配置 */
export interface LogRecordOption {
  /** 操作标题 */
  title?: string;
  /** 业务类型序数，默认 OTHER */
  business?: BusinessTypeValue | number;
  /** 操作端序数，默认 PC */
  oper?: OperTypeValue | number;
  /** 额外排除的参数名（密码等默认已排除） */
  excludeParamNames?: string[];
  /** 为 true 时本接口不记日志 */
  ignore?: boolean;
}

/** Log() 工厂全局配置 */
export interface LogModuleOptions {
  /** 是否启用（默认 true） */
  enabled?: boolean;
  /** 默认排除字段 */
  excludeParamNames?: string[];
  /** 异步写入失败是否打印 */
  silent?: boolean;
}
