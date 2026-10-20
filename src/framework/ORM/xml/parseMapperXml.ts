import type { SqlNode, XmlMapperFile, XmlStatement, XmlStatementKind } from "./types";

interface Attrs {
  [key: string]: string;
}

function stripNoise(xml: string): string {
  return xml
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
}

function parseAttrs(raw: string): Attrs {
  const attrs: Attrs = {};
  const re = /([A-Za-z_][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    attrs[m[1]] = m[2] ?? m[3] ?? "";
  }
  return attrs;
}

interface TagOpen {
  name: string;
  attrs: Attrs;
  selfClosing: boolean;
  end: number;
}

function readOpenTag(src: string, from: number): TagOpen | null {
  if (src[from] !== "<") return null;
  if (src[from + 1] === "/" || src[from + 1] === "!" || src[from + 1] === "?") {
    return null;
  }
  const end = src.indexOf(">", from);
  if (end < 0) throw new Error("XML 标签未闭合");
  const body = src.slice(from + 1, end).trim();
  const selfClosing = body.endsWith("/");
  const inner = selfClosing ? body.slice(0, -1).trim() : body;
  const sp = inner.search(/\s/);
  const name = (sp < 0 ? inner : inner.slice(0, sp)).toLowerCase();
  const attrRaw = sp < 0 ? "" : inner.slice(sp);
  return {
    name,
    attrs: parseAttrs(attrRaw),
    selfClosing,
    end: end + 1,
  };
}

function findCloseTag(src: string, name: string, from: number): number {
  const openRe = new RegExp(`<${name}\\b`, "gi");
  const closeRe = new RegExp(`</${name}\\s*>`, "gi");
  let depth = 1;
  let i = from;
  while (i < src.length && depth > 0) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const o = openRe.exec(src);
    const c = closeRe.exec(src);
    if (!c) throw new Error(`缺少结束标签 </${name}>`);
    if (o && o.index < c.index) {
      // 可能是开标签；检查是否自闭合
      const tag = readOpenTag(src, o.index);
      if (tag && !tag.selfClosing) depth += 1;
      i = tag ? tag.end : o.index + 1;
    } else {
      depth -= 1;
      if (depth === 0) return c.index;
      i = c.index + c[0].length;
    }
  }
  throw new Error(`缺少结束标签 </${name}>`);
}

function parseChildren(src: string): SqlNode[] {
  const nodes: SqlNode[] = [];
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf("<", i);
    if (lt < 0) {
      const text = src.slice(i);
      if (text) nodes.push({ type: "text", text });
      break;
    }
    if (lt > i) {
      nodes.push({ type: "text", text: src.slice(i, lt) });
    }
    if (src.startsWith("</", lt)) break;

    // CDATA → 纯文本
    if (src.startsWith("<![CDATA[", lt)) {
      const end = src.indexOf("]]>", lt);
      if (end < 0) throw new Error("CDATA 未闭合");
      nodes.push({ type: "text", text: src.slice(lt + 9, end) });
      i = end + 3;
      continue;
    }

    const open = readOpenTag(src, lt);
    if (!open) {
      // 非标签的 <（如 age < 10）当作文本；建议用 CDATA
      nodes.push({ type: "text", text: src[lt]! });
      i = lt + 1;
      continue;
    }

    if (open.selfClosing) {
      nodes.push(elementToNode(open.name, open.attrs, []));
      i = open.end;
      continue;
    }

    const closeAt = findCloseTag(src, open.name, open.end);
    const inner = src.slice(open.end, closeAt);
    const closeEnd = src.indexOf(">", closeAt) + 1;
    nodes.push(elementToNode(open.name, open.attrs, parseChildren(inner)));
    i = closeEnd;
  }
  return nodes;
}

function elementToNode(name: string, attrs: Attrs, children: SqlNode[]): SqlNode {
  switch (name) {
    case "if":
      if (!attrs.test?.trim()) throw new Error("<if> 缺少 test");
      return { type: "if", test: attrs.test.trim(), children };
    case "where":
      return { type: "where", children };
    case "set":
      return { type: "set", children };
    case "trim":
      return {
        type: "trim",
        prefix: attrs.prefix,
        suffix: attrs.suffix,
        prefixOverrides: attrs.prefixOverrides,
        suffixOverrides: attrs.suffixOverrides,
        children,
      };
    case "foreach":
      if (!attrs.collection?.trim()) throw new Error("<foreach> 缺少 collection");
      return {
        type: "foreach",
        collection: attrs.collection.trim(),
        item: (attrs.item ?? "item").trim(),
        index: attrs.index?.trim(),
        open: attrs.open,
        close: attrs.close,
        separator: attrs.separator,
        children,
      };
    case "include":
      if (!attrs.refid?.trim()) throw new Error("<include> 缺少 refid");
      return { type: "include", refid: attrs.refid.trim() };
    default:
      // 未知标签当文本保留，避免吞掉合法 SQL 中的比较符误伤；此处仅动态节点白名单
      throw new Error(`XML Mapper 不支持标签 <${name}>`);
  }
}

const STMT_KINDS = new Set<string>(["select", "insert", "update", "delete"]);

/**
 * 解析单个 Mapper XML 文本。
 */
export function parseMapperXml(xml: string, sourceFile = ""): XmlMapperFile {
  const cleaned = stripNoise(xml);
  const rootOpen = readOpenTag(cleaned, cleaned.indexOf("<"));
  if (!rootOpen || rootOpen.name !== "mapper") {
    throw new Error(`${sourceFile || "XML"}: 根节点必须是 <mapper>`);
  }
  const namespace = (rootOpen.attrs.namespace ?? "").trim();
  if (!namespace) {
    throw new Error(`${sourceFile || "XML"}: <mapper> 缺少 namespace`);
  }

  const rootClose = findCloseTag(cleaned, "mapper", rootOpen.end);
  const body = cleaned.slice(rootOpen.end, rootClose);

  const sqlFragments = new Map<string, SqlNode[]>();
  const statements: XmlStatement[] = [];

  let i = 0;
  while (i < body.length) {
    const lt = body.indexOf("<", i);
    if (lt < 0) break;
    if (body.startsWith("</", lt)) break;
    const open = readOpenTag(body, lt);
    if (!open) {
      i = lt + 1;
      continue;
    }
    if (open.selfClosing) {
      i = open.end;
      continue;
    }
    const closeAt = findCloseTag(body, open.name, open.end);
    const inner = body.slice(open.end, closeAt);
    const closeEnd = body.indexOf(">", closeAt) + 1;
    const id = (open.attrs.id ?? "").trim();

    if (open.name === "sql") {
      if (!id) throw new Error(`${sourceFile}: <sql> 缺少 id`);
      if (sqlFragments.has(id)) {
        throw new Error(`${sourceFile}: 重复 <sql id="${id}">`);
      }
      sqlFragments.set(id, parseChildren(inner));
    } else if (STMT_KINDS.has(open.name)) {
      if (!id) throw new Error(`${sourceFile}: <${open.name}> 缺少 id`);
      statements.push({
        namespace,
        id,
        kind: open.name as XmlStatementKind,
        nodes: parseChildren(inner),
        resultType: open.attrs.resultType?.trim() || undefined,
        datasource: open.attrs.datasource?.trim() || undefined,
        sourceFile,
      });
    } else if (open.name === "resultmap") {
      // 首期跳过 resultMap 内容
    } else {
      throw new Error(
        `${sourceFile}: 不支持的顶层标签 <${open.name}>（仅 sql/select/insert/update/delete）`
      );
    }
    i = closeEnd;
  }

  return { namespace, sourceFile, sqlFragments, statements };
}
