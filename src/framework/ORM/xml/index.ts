export { parseMapperXml } from "./parseMapperXml";
export { renderStatementSql, evalTest } from "./renderSql";
export {
  loadXmlMappers,
  ensureXmlMappersLoaded,
  resetXmlLoadState,
  watchXmlMappers,
  isXmlMappersLoaded,
} from "./loadMappers";
export {
  clearXmlRegistry,
  getXmlStatement,
  getXmlNamespace,
  listXmlNamespaces,
  countXmlStatements,
} from "./registry";
export { executeXmlStatement } from "./execute";
export { MapperXml, bootstrapXmlMappers, getMapperXmlNamespace } from "./MapperXml";
export { xmlMapper } from "./xmlMapper";
export type { XmlMapperApi } from "./xmlMapper";
export type { MapperXmlOptions } from "./MapperXml";
export type {
  SqlNode,
  XmlStatement,
  XmlStatementKind,
  XmlMapperFile,
} from "./types";
