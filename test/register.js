const path = require("path");
const tsConfigPaths = require("tsconfig-paths");

process.env.TS_NODE_PROJECT = path.join(__dirname, "../tsconfig.test.json");
require("ts-node/register");

// 只改写 @/。不要把 inversify 指到 .d.ts，否则运行时会去加载类型声明。
tsConfigPaths.register({
  baseUrl: path.join(__dirname, ".."),
  paths: {
    "@/*": ["src/*"],
  },
});
