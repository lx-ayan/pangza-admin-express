/**
 * ts-node-dev 启动注册：
 * 只改写 @/。不要把 inversify 指到 .d.ts，否则运行时会去加载类型声明
 *（报 Unexpected identifier 'AbstractNewable'）。
 */
const path = require("path");
const tsConfigPaths = require("tsconfig-paths");

tsConfigPaths.register({
  baseUrl: path.join(__dirname, ".."),
  paths: {
    "@/*": ["src/*"],
  },
});
