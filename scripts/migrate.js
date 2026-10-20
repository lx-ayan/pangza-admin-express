/**
 * 轻量 SQL 迁移：读取 migrations/V*.sql，按序在 default 数据源执行。
 * 依赖已编译或 ts-node；开发期用 register + 动态 require ORM。
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
process.chdir(root);

require("./register-dev.js");
require("ts-node/register/transpile-only");

async function main() {
  const { default: Db } = require("../src/framework/ORM/Db");

  const dir = path.join(root, "migrations");
  if (!fs.existsSync(dir)) {
    console.error("[migrate] 缺少 migrations/ 目录");
    process.exit(1);
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => /^V\d+__.+\.sql$/i.test(f))
    .sort((a, b) => {
      const na = Number(a.match(/^V(\d+)/i)?.[1] ?? 0);
      const nb = Number(b.match(/^V(\d+)/i)?.[1] ?? 0);
      return na - nb;
    });

  await Db.connect();

  await Db.query(`
    CREATE TABLE IF NOT EXISTS orm_schema_history (
      version VARCHAR(64) NOT NULL PRIMARY KEY,
      script VARCHAR(255) NOT NULL,
      executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const doneRows = await Db.query(
    "SELECT version FROM orm_schema_history ORDER BY version"
  );
  const done = new Set(
    (Array.isArray(doneRows) ? doneRows : []).map((r) => String(r.version))
  );

  let applied = 0;
  for (const file of files) {
    const version = file.match(/^(V\d+)/i)?.[1] ?? file;
    if (done.has(version)) {
      console.log(`[migrate] skip ${file}`);
      continue;
    }
    const sqlText = fs.readFileSync(path.join(dir, file), "utf8");
    const statements = sqlText
      .split(/;\s*(?:\r?\n|$)/)
      .map((s) => s.trim())
      .filter((s) => s && !/^--/.test(s));

    console.log(`[migrate] apply ${file} (${statements.length} statements)`);
    await Db.transaction(async () => {
      for (const stmt of statements) {
        await Db.query(stmt);
      }
      await Db.query(
        "INSERT INTO orm_schema_history (version, script) VALUES (?, ?)",
        [version, file]
      );
    });
    applied += 1;
  }

  console.log(`[migrate] done, applied=${applied}`);
  await Db.disconnect();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
