import { getLogger } from "@/framework/Logger";

const log = getLogger("Process");

let installed = false;

/**
 * 安装进程级错误兜底，避免未处理 Promise / 同步异常直接把 Node 打挂。
 * - unhandledRejection：只打日志，不 exit
 * - uncaughtException：打日志，不 exit（状态可能已不一致，生产建议配合进程守护重启）
 */
export function installProcessErrorGuards(): void {
  if (installed) return;
  installed = true;

  process.on("unhandledRejection", (reason) => {
    log.error(
      { err: reason instanceof Error ? reason : new Error(String(reason)) },
      "未处理的 Promise 拒绝（已吞掉，进程继续）"
    );
  });

  process.on("uncaughtException", (err) => {
    log.error({ err }, "未捕获异常（已吞掉，进程继续；建议排查根因）");
  });
}
