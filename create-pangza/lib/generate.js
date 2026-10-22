"use strict";

const fs = require("fs");
const path = require("path");
const { toSnake, toPascal, toApiPath, toFileBase } = require("./names");

const KINDS = {
  entity: { alias: ["e", "entity"] },
  mapper: { alias: ["m", "mapper"] },
  service: { alias: ["s", "service"] },
  controller: { alias: ["c", "controller", "cotroller"] }, // cotroller: 常见拼写容错
  all: { alias: ["all", "a"] },
};

function resolveKind(raw) {
  const key = String(raw || "").toLowerCase();
  for (const [kind, meta] of Object.entries(KINDS)) {
    if (meta.alias.includes(key)) return kind;
  }
  return null;
}

function findProjectRoot(cwd = process.cwd()) {
  let dir = cwd;
  for (;;) {
    const pkg = path.join(dir, "package.json");
    if (fs.existsSync(pkg)) {
      try {
        const json = JSON.parse(fs.readFileSync(pkg, "utf8"));
        const deps = {
          ...(json.dependencies || {}),
          ...(json.devDependencies || {}),
        };
        if (deps["@pangza/express"]) return dir;
      } catch {
        /* ignore */
      }
      // 有 package.json 也当作项目根（容错）
      if (fs.existsSync(path.join(dir, "src"))) return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return cwd;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content, { force }) {
  if (fs.existsSync(filePath) && !force) {
    return { path: filePath, status: "skip" };
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
  return { path: filePath, status: fs.existsSync(filePath) ? "write" : "write" };
}

function tplEntity({ Pascal, snake }) {
  return `import { TableField, TableId, TableName } from "@pangza/express";

@TableName("${snake}")
export default class ${Pascal}Entity {
  @TableId()
  id!: string;

  @TableField({
    value: "create_time",
    insertFill: () => new Date(),
  })
  createTime?: Date;

  @TableField({
    value: "update_time",
    insertFill: () => new Date(),
    updateFill: () => new Date(),
  })
  updateTime?: Date;

  @TableField({
    value: "delete_flag",
    insertFill: 0,
  })
  deleteFlag?: number;
}
`;
}

function tplMapper({ Pascal, fileBase }) {
  return `import { Mapper, MapperType } from "@pangza/express";
import ${Pascal}Entity from "../entity/${fileBase}";

@Mapper(${Pascal}Entity)
export default class ${Pascal}Mapper extends MapperType {}
`;
}

function tplService({ Pascal, fileBase }) {
  return `import { BaseService, Service } from "@pangza/express";
import ${Pascal}Mapper from "../mapper/${fileBase}";

@Service(${Pascal}Mapper)
export default class ${Pascal}Service extends BaseService {}
`;
}

function tplController({ Pascal, fileBase, apiPath, camel }) {
  return `import {
  Controller,
  DeleteMapping,
  GetMapping,
  PostMapping,
  PutMapping,
  RequestBody,
  RequestPath,
  Resource,
} from "@pangza/express";
import ${Pascal}Service from "../../service/${fileBase}";

@Controller("/api/${apiPath}")
export default class ${Pascal}Controller {
  @Resource(${Pascal}Service)
  ${camel}Service!: ${Pascal}Service;

  @GetMapping("/")
  list() {
    return this.${camel}Service.selectList();
  }

  @GetMapping("/:id")
  detail(@RequestPath() id: string) {
    return this.${camel}Service.selectById(id);
  }

  @PostMapping("/")
  create(@RequestBody() body: Record<string, unknown>) {
    return this.${camel}Service.insert(body);
  }

  @PutMapping("/:id")
  update(@RequestPath() id: string, @RequestBody() body: Record<string, unknown>) {
    return this.${camel}Service.updateById({ ...body, id });
  }

  @DeleteMapping("/:id")
  remove(@RequestPath() id: string) {
    return this.${camel}Service.deleteById(id);
  }
}
`;
}

/**
 * @param {{
 *   kind: string,
 *   name: string,
 *   cwd?: string,
 *   force?: boolean,
 * }} opts
 */
function generate(opts) {
  const kind = resolveKind(opts.kind);
  if (!kind) {
    throw new Error(
      `Unknown type "${opts.kind}". Use: controller|service|mapper|entity|all`,
    );
  }
  if (!opts.name || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(opts.name)) {
    throw new Error(`Invalid name: ${opts.name}`);
  }

  const root = findProjectRoot(opts.cwd || process.cwd());
  const fileBase = toFileBase(opts.name);
  const Pascal = toPascal(opts.name);
  const snake = toSnake(opts.name);
  const apiPath = toApiPath(opts.name);
  const camel = fileBase;
  const force = Boolean(opts.force);

  const ctx = { Pascal, snake, fileBase, apiPath, camel };

  /** @type {{ kind: string, rel: string, content: string }[]} */
  const jobs = [];

  const want = kind === "all"
    ? ["entity", "mapper", "service", "controller"]
    : [kind];

  for (const k of want) {
    if (k === "entity") {
      jobs.push({
        kind: k,
        rel: path.join("src", "entity", `${fileBase}.ts`),
        content: tplEntity(ctx),
      });
    } else if (k === "mapper") {
      jobs.push({
        kind: k,
        rel: path.join("src", "mapper", `${fileBase}.ts`),
        content: tplMapper(ctx),
      });
    } else if (k === "service") {
      jobs.push({
        kind: k,
        rel: path.join("src", "service", `${fileBase}.ts`),
        content: tplService(ctx),
      });
    } else if (k === "controller") {
      jobs.push({
        kind: k,
        rel: path.join("src", "controller", fileBase, "index.ts"),
        content: tplController(ctx),
      });
    }
  }

  const results = [];
  for (const job of jobs) {
    const abs = path.join(root, job.rel);
    const r = writeFile(abs, job.content, { force });
    results.push({ kind: job.kind, ...r, rel: job.rel });
  }

  return { root, results, Pascal, snake };
}

module.exports = {
  KINDS,
  resolveKind,
  findProjectRoot,
  generate,
};
