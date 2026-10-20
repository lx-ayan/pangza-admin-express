export type XmlStatementKind = "select" | "insert" | "update" | "delete";

/** 动态 SQL 节点树 */
export type SqlNode =
  | { type: "text"; text: string }
  | { type: "if"; test: string; children: SqlNode[] }
  | { type: "where"; children: SqlNode[] }
  | { type: "set"; children: SqlNode[] }
  | { type: "trim"; prefix?: string; suffix?: string; prefixOverrides?: string; suffixOverrides?: string; children: SqlNode[] }
  | {
      type: "foreach";
      collection: string;
      item: string;
      index?: string;
      open?: string;
      close?: string;
      separator?: string;
      children: SqlNode[];
    }
  | { type: "include"; refid: string };

export interface XmlStatement {
  namespace: string;
  id: string;
  kind: XmlStatementKind;
  nodes: SqlNode[];
  resultType?: string;
  datasource?: string;
  /** 来源文件，便于报错 */
  sourceFile?: string;
}

export interface XmlMapperFile {
  namespace: string;
  sourceFile: string;
  sqlFragments: Map<string, SqlNode[]>;
  statements: XmlStatement[];
}
