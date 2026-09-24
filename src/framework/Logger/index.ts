import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import pino, {
  type DestinationStream,
  type Level,
  type Logger as PinoLogger,
  type StreamEntry,
} from "pino";
import pretty from "pino-pretty";
import type { LoggerOptions, LogLevel } from "./types";

let rootLogger: PinoLogger | null = null;
let currentOptions: LoggerOptions = {};
let utf8Ready = false;

function isPrettyEnabled(options: LoggerOptions): boolean {
  if (options.pretty !== undefined) return options.pretty;
  return process.env.NODE_ENV !== "production";
}

function toStreamLevel(level: LogLevel): Level | undefined {
  return level === "silent" ? undefined : (level as Level);
}

/**
 * Windows 控制台默认常为 GBK(936)，Node/pino 输出 UTF-8 会导致中文乱码。
 * 启动时切到 UTF-8 代码页，并尽量固定 stdout 编码。
 */
export function ensureUtf8Console(): void {
  if (utf8Ready) return;
  utf8Ready = true;

  try {
    if (typeof process.stdout.setDefaultEncoding === "function") {
      process.stdout.setDefaultEncoding("utf8");
    }
    if (typeof process.stderr.setDefaultEncoding === "function") {
      process.stderr.setDefaultEncoding("utf8");
    }
  } catch {
    // ignore
  }

  if (process.platform !== "win32") return;

  try {
    spawnSync(process.env.ComSpec || "cmd.exe", ["/c", "chcp", "65001", ">nul"], {
      stdio: "ignore",
      windowsHide: true,
    });
  } catch {
    // ignore
  }

  // Electron / 部分终端：提示使用 UTF-8
  if (!process.env.PYTHONUTF8) {
    process.env.PYTHONUTF8 = "1";
  }
}

function buildLogger(options: LoggerOptions = {}): PinoLogger {
  ensureUtf8Console();

  const level: LogLevel = options.level ?? "info";
  const useConsole = options.console !== false;
  const useFile = options.file !== false;
  const usePretty = isPrettyEnabled(options);
  const logDir = path.resolve(process.cwd(), options.logDir ?? "logs");
  const filename = options.filename ?? "app.log";
  const errorFilename = options.errorFilename;

  if (useFile && !fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const streams: StreamEntry[] = [];

  if (useConsole) {
    if (usePretty) {
      // 主线程同步 pretty，避免 pino.transport worker 在 Windows 上中文乱码
      const prettyStream = pretty({
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
        ignore: "pid,hostname",
        sync: true,
        destination: process.stdout,
      }) as DestinationStream;
      streams.push({ level: toStreamLevel(level), stream: prettyStream });
    } else {
      streams.push({ level: toStreamLevel(level), stream: process.stdout });
    }
  }

  if (useFile) {
    streams.push({
      level: toStreamLevel(level),
      stream: pino.destination({
        dest: path.join(logDir, filename),
        mkdir: true,
        // 同步写更稳；日志量不大时足够
        sync: true,
      }),
    });
    if (errorFilename !== false) {
      streams.push({
        level: "error",
        stream: pino.destination({
          dest: path.join(logDir, errorFilename || "error.log"),
          mkdir: true,
          sync: true,
        }),
      });
    }
  }

  const base = {
    name: "pangza",
    // 保证序列化为 UTF-8 可读 JSON
    messageKey: "msg",
    ...(options.pino ?? {}),
  };

  if (streams.length === 0) {
    return pino({ level, ...base });
  }

  if (streams.length === 1) {
    return pino({ level, ...base }, streams[0].stream);
  }

  return pino({ level, ...base }, pino.multistream(streams));
}

/**
 * 配置全局 pino Logger。
 * 建议启动最早调用；也可 Application.registry(Logger({ level: 'debug' }))。
 */
export function configureLogger(options: LoggerOptions = {}): void {
  currentOptions = { ...currentOptions, ...options };
  rootLogger = buildLogger(currentOptions);
}

function ensureRoot(): PinoLogger {
  if (!rootLogger) {
    configureLogger();
  }
  return rootLogger!;
}

/**
 * 按模块名取子 Logger（pino child）。
 *
 * @example
 * const log = getLogger('UserService');
 * log.info('login ok');
 * log.info({ userId }, 'login ok');
 * log.error(err, 'login failed');
 */
export function getLogger(name = "app"): PinoLogger {
  return ensureRoot().child({ module: name });
}

/** 默认应用 Logger */
export function getRootLogger(): PinoLogger {
  return ensureRoot();
}

/** 便捷方法：直接打到 app 分类 */
export const logger = {
  trace: (obj: unknown, msg?: string, ...args: unknown[]) =>
    (getLogger("app") as any).trace(obj, msg, ...args),
  debug: (obj: unknown, msg?: string, ...args: unknown[]) =>
    (getLogger("app") as any).debug(obj, msg, ...args),
  info: (obj: unknown, msg?: string, ...args: unknown[]) =>
    (getLogger("app") as any).info(obj, msg, ...args),
  warn: (obj: unknown, msg?: string, ...args: unknown[]) =>
    (getLogger("app") as any).warn(obj, msg, ...args),
  error: (obj: unknown, msg?: string, ...args: unknown[]) =>
    (getLogger("app") as any).error(obj, msg, ...args),
  fatal: (obj: unknown, msg?: string, ...args: unknown[]) =>
    (getLogger("app") as any).fatal(obj, msg, ...args),
};

/**
 * 可选模块工厂：Application.registry(Logger({ level: 'debug' }))
 */
export default function Logger(options: LoggerOptions = {}) {
  configureLogger(options);
  const middleware = (
    _req: unknown,
    _res: unknown,
    next: (err?: unknown) => void
  ) => next();
  Object.defineProperty(middleware, Symbol.for("pangza.logger.module"), {
    value: true,
    enumerable: false,
  });
  return middleware;
}

export type { PinoLogger };
export type { LoggerOptions, LogLevel } from "./types";
