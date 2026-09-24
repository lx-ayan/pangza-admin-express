/** @JsonFormat 配置（对齐 Jackson） */
export interface JsonFormatOptions {
  /**
   * 日期/时间格式，支持：
   * yyyy MM dd HH mm ss SSS
   * @example 'yyyy-MM-dd HH:mm:ss'
   */
  pattern?: string;
  /** 时区偏移小时，如 8 表示 UTC+8；不传则用本地时区 */
  timezone?: number;
}

/**
 * @JsonInclude 策略（对齐 Jackson JsonInclude.Include）
 */
export enum JsonIncludeType {
  /** 始终序列化 */
  ALWAYS = "ALWAYS",
  /** 跳过 null / undefined */
  NON_NULL = "NON_NULL",
  /** 跳过 null / undefined / '' / [] / 空对象 */
  NON_EMPTY = "NON_EMPTY",
  /** 跳过 null / undefined / 0 / false / '' / [] / {} */
  NON_DEFAULT = "NON_DEFAULT",
}

/** @JsonInclude 配置 */
export interface JsonIncludeOptions {
  value?: JsonIncludeType;
}

/** ObjectMapper 全局配置 */
export interface ObjectMapperOptions {
  /** 默认日期格式，未标注 @JsonFormat 的 Date 使用此格式 */
  dateFormat?: string;
  /** 是否递归序列化；默认 true */
  deep?: boolean;
  /** 全局 @JsonInclude 默认策略 */
  include?: JsonIncludeType;
}

/** 字段级格式元数据 */
export interface JsonFieldFormatMeta {
  property: string;
  options: JsonFormatOptions;
}

/** 字段级 Include 元数据 */
export interface JsonFieldIncludeMeta {
  property: string;
  options: JsonIncludeOptions;
}
