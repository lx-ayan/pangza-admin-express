/**
 * 生产打包：tsc → tsc-alias → terser 压缩 dist 内所有 .js
 *
 * 说明：
 * - 本项目 Application 会扫描目录 require 控制器，必须保留多文件结构，不能打成单 bundle
 * - 装饰器 / Inversify / emitDecoratorMetadata 依赖类名、函数名，故 keep_classnames / keep_fnames
 * - 比裸 tsc 输出更短、更难直接阅读；完整混淆（改写标识符）会破坏 DI，故不用
 *
 * 用法：npm run build
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");

function run(command) {
  console.log(`[build] $ ${command}`);
  const result = spawnSync(command, {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function listJsFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) listJsFiles(full, out);
    else if (name.endsWith(".js")) out.push(full);
  }
  return out;
}

async function minifyFile(file) {
  const code = fs.readFileSync(file, "utf8");
  const result = await minify(code, {
    compress: {
      passes: 2,
      keep_classnames: true,
      keep_fnames: true,
      // 服务端日志保留；若要上线去掉 console，改为 true
      drop_debugger: true,
      drop_console: false,
    },
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
    format: {
      comments: false,
    },
    sourceMap: false,
  });

  if (result.error) {
    throw new Error(`${file}: ${result.error.message || result.error}`);
  }
  if (result.code == null) {
    throw new Error(`${file}: terser 未产出代码`);
  }

  const before = Buffer.byteLength(code, "utf8");
  const after = Buffer.byteLength(result.code, "utf8");
  fs.writeFileSync(file, result.code, "utf8");
  return { before, after };
}

async function minifyDist() {
  const files = listJsFiles(distDir);
  if (files.length === 0) {
    console.error("[build] dist 下没有 .js，请检查 tsc 是否成功");
    process.exit(1);
  }

  let totalBefore = 0;
  let totalAfter = 0;
  for (const file of files) {
    const { before, after } = await minifyFile(file);
    totalBefore += before;
    totalAfter += after;
  }

  const saved = totalBefore - totalAfter;
  const pct = totalBefore ? ((saved / totalBefore) * 100).toFixed(1) : "0";
  console.log(
    `[build] minify ${files.length} files: ${(totalBefore / 1024).toFixed(1)}KB → ${(totalAfter / 1024).toFixed(1)}KB (−${pct}%)`
  );
}

async function main() {
  const skipMinify = process.argv.includes("--no-minify");

  // 干净输出，避免残留旧文件
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }

  run("npx tsc -p tsconfig.json");
  run("npx tsc-alias -p tsconfig.json");

  if (skipMinify) {
    console.log("[build] 跳过 minify（--no-minify）");
  } else {
    console.log("[build] terser 压缩中…");
    await minifyDist();
  }

  console.log("[build] 完成 → dist/ ，启动：npm start");
}

main().catch((err) => {
  console.error("[build] 失败:", err);
  process.exit(1);
});
