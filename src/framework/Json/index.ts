import { ObjectMapper } from "./ObjectMapper";

export { ObjectMapper, formatDate, shouldOmitByInclude } from "./ObjectMapper";
export {
  JsonFormat,
  JsonInclude,
  getJsonFieldFormats,
  getJsonFieldFormat,
  getGlobalFieldFormat,
  getGlobalFieldInclude,
  getClassJsonInclude,
  getJsonFieldIncludes,
  getJsonFieldInclude,
} from "./decorators";
export {
  convert,
  copyProperties,
  pick,
  JsonProperty,
} from "./convert";
export type { ConvertOptions } from "./convert";
export { addBeanKey, getBeanKeys } from "./beanKeys";
export { JsonIncludeType } from "./types";
export type {
  JsonFormatOptions,
  JsonIncludeOptions,
  ObjectMapperOptions,
  JsonFieldFormatMeta,
  JsonFieldIncludeMeta,
} from "./types";

/**
 * 可选模块工厂：通过 Application.registry(Json({ dateFormat: '...' })) 配置全局序列化。
 * 不注册时仍会使用默认 ObjectMapper（Date → yyyy-MM-dd HH:mm:ss）。
 */
export default function Json(
  options: {
    dateFormat?: string;
    deep?: boolean;
    include?: import("./types").JsonIncludeType;
  } = {}
) {
  ObjectMapper.configure(options);
  const middleware = (
    _req: unknown,
    _res: unknown,
    next: (err?: unknown) => void
  ) => next();
  Object.defineProperty(middleware, Symbol.for("pangza.json.module"), {
    value: true,
    enumerable: false,
  });
  return middleware;
}
