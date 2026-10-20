import fs from "fs";
import path from "path";
import { getOrmConfig } from "../config";
import { parseMapperXml } from "./parseMapperXml";
import {
  clearXmlRegistry,
  countXmlStatements,
  listXmlNamespaces,
  registerXmlBundle,
} from "./registry";

let loaded = false;
let watching = false;

function resolveLocation(raw: string): { root: string; pattern: string } {
  const loc = String(raw ?? "").trim();
  if (!loc) throw new Error("mapperLocations 项不能为空");
  // 相对路径相对 process.cwd()（项目根）；绝对路径原样使用。支持 ** / * 通配。
  const abs = path.isAbsolute(loc) ? loc : path.resolve(process.cwd(), loc);
  // 含通配：拆成目录前缀 + glob（勿对带尾部分隔符的路径再 dirname，否则会少一层）
  const star = abs.search(/[*?]/);
  if (star < 0) {
    return { root: abs, pattern: "**/*.xml" };
  }
  const before = abs.slice(0, star).replace(/[/\\]+$/, "");
  const root = before || process.cwd();
  const pattern = path
    .relative(root, abs)
    .split(path.sep)
    .join("/");
  return { root, pattern: pattern || "**/*.xml" };
}

function matchGlob(rel: string, pattern: string): boolean {
  // 极简 glob：支持 ** / * ；`**/*.xml` 也能匹配根目录下 foo.xml
  const norm = rel.split(path.sep).join("/");
  const esc = pattern
    .split(path.sep)
    .join("/")
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "(?:.*/)?")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*");
  return new RegExp(`^${esc}$`, "i").test(norm);
}

function walkFiles(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  const st = fs.statSync(dir);
  if (st.isFile()) {
    if (dir.toLowerCase().endsWith(".xml")) out.push(dir);
    return out;
  }
  if (!st.isDirectory()) return out;
  for (const name of fs.readdirSync(dir)) {
    walkFiles(path.join(dir, name), out);
  }
  return out;
}

function collectXmlFiles(location: string): string[] {
  const { root, pattern } = resolveLocation(location);
  if (!fs.existsSync(root)) {
    console.warn(`[ORM] mapperLocations 路径不存在: ${location} -> ${root}`);
    return [];
  }
  const st = fs.statSync(root);
  if (st.isFile()) {
    return root.toLowerCase().endsWith(".xml") ? [root] : [];
  }
  const all = walkFiles(root);
  return all.filter((file) => {
    const rel = path.relative(root, file);
    return matchGlob(rel, pattern);
  });
}

/** 从配置扫描并注册全部 XML（可重复调用；会清空后重载） */
export function loadXmlMappers(locations?: string[]): {
  files: number;
  statements: number;
  namespaces: string[];
} {
  const cfg = getOrmConfig();
  const locs =
    locations ??
    cfg.mapperLocations ??
    [];
  clearXmlRegistry();

  if (!locs.length) {
    loaded = true;
    return { files: 0, statements: 0, namespaces: [] };
  }

  const files = new Set<string>();
  for (const loc of locs) {
    for (const f of collectXmlFiles(loc)) files.add(path.normalize(f));
  }

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const parsed = parseMapperXml(text, file);
    registerXmlBundle(
      parsed.namespace,
      file,
      parsed.sqlFragments,
      parsed.statements
    );
  }

  loaded = true;
  const statements = countXmlStatements();
  const namespaces = listXmlNamespaces();
  if (files.size || statements) {
    console.info(
      `[ORM] loaded ${statements} statements from ${files.size} xml file(s)`
    );
  }
  return { files: files.size, statements, namespaces };
}

/** 确保已按配置加载（惰性） */
export function ensureXmlMappersLoaded(): void {
  if (loaded) return;
  loadXmlMappers();
}

export function isXmlMappersLoaded(): boolean {
  return loaded;
}

/** 测试用：标记未加载 */
export function resetXmlLoadState(): void {
  loaded = false;
  clearXmlRegistry();
}

/** 开发热加载：监听已配置目录（简版，按文件 mtime 全量重载） */
export function watchXmlMappers(): void {
  if (watching) return;
  const cfg = getOrmConfig();
  if (!cfg.mapperReload) return;
  const locs = cfg.mapperLocations ?? [];
  if (!locs.length) return;
  watching = true;

  const roots = new Set<string>();
  for (const loc of locs) {
    try {
      roots.add(resolveLocation(loc).root);
    } catch {
      // ignore
    }
  }

  let timer: NodeJS.Timeout | null = null;
  const reload = () => {
    try {
      loadXmlMappers();
    } catch (err) {
      console.error("[ORM] XML 热加载失败", err);
    }
  };

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    try {
      fs.watch(root, { recursive: true }, (_event, filename) => {
        if (filename && !String(filename).toLowerCase().endsWith(".xml")) {
          return;
        }
        if (timer) clearTimeout(timer);
        timer = setTimeout(reload, 300);
      });
    } catch {
      // Windows 部分路径不支持 recursive
    }
  }
}
