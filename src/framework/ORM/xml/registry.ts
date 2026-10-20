import type { SqlNode, XmlStatement } from "./types";

export interface XmlNamespaceBundle {
  namespace: string;
  fragments: Map<string, SqlNode[]>;
  statements: Map<string, XmlStatement>;
  files: string[];
}

const namespaces = new Map<string, XmlNamespaceBundle>();

export function clearXmlRegistry(): void {
  namespaces.clear();
}

export function getXmlNamespace(namespace: string): XmlNamespaceBundle | undefined {
  return namespaces.get(namespace);
}

export function listXmlNamespaces(): string[] {
  return [...namespaces.keys()];
}

export function registerXmlBundle(
  namespace: string,
  sourceFile: string,
  fragments: Map<string, SqlNode[]>,
  statements: XmlStatement[]
): void {
  let bundle = namespaces.get(namespace);
  if (!bundle) {
    bundle = {
      namespace,
      fragments: new Map(),
      statements: new Map(),
      files: [],
    };
    namespaces.set(namespace, bundle);
  }
  bundle.files.push(sourceFile);

  for (const [id, nodes] of fragments) {
    if (bundle.fragments.has(id)) {
      throw new Error(
        `XML 重复 <sql id="${id}">（namespace=${namespace}, file=${sourceFile}）`
      );
    }
    bundle.fragments.set(id, nodes);
  }

  for (const stmt of statements) {
    if (bundle.statements.has(stmt.id)) {
      throw new Error(
        `XML 重复语句 id="${stmt.id}"（namespace=${namespace}, file=${sourceFile}）`
      );
    }
    bundle.statements.set(stmt.id, stmt);
  }
}

export function getXmlStatement(
  namespace: string,
  id: string
): XmlStatement | undefined {
  return namespaces.get(namespace)?.statements.get(id);
}

export function getXmlFragments(
  namespace: string
): Map<string, SqlNode[]> {
  return namespaces.get(namespace)?.fragments ?? new Map();
}

export function countXmlStatements(): number {
  let n = 0;
  for (const b of namespaces.values()) n += b.statements.size;
  return n;
}
