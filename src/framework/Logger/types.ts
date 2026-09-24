import type { LoggerOptions as PinoLoggerOptions } from "pino";

/** pino 日志级别 */
export type LogLevel =
  | "fatal"
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "trace"
  | "silent";

/** Logger 模块配置 */
export interface LoggerOptions {
  /** 日志级别，默认 info */
  level?: LogLevel;
  /** 是否输出到控制台，默认 true */
  console?: boolean;
  /** 开发态是否美化输出（pino-pretty），默认 NODE_ENV !== 'production' */
  pretty?: boolean;
  /** 是否写文件，默认 true */
  file?: boolean;
  /** 日志目录，默认 logs */
  logDir?: string;
  /** 应用日志文件名，默认 app.log */
  filename?: string;
  /** 错误日志单独文件，默认 error.log；设 false 关闭 */
  errorFilename?: string | false;
  /** 透传给 pino 的额外选项 */
  pino?: PinoLoggerOptions;
}
