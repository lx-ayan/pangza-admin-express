import { getLogger } from "@/framework/Logger";

const log = getLogger("Warmup");

/**
 * listen 之后并行预热 Redis / 默认数据源（失败只打日志）。
 * 由 ApplicationInit 或 applicationStart 调用均可。
 */
export async function warmupConnections(): Promise<void> {
  const tasks: Array<Promise<void>> = [];

  tasks.push(
    (async () => {
      try {
        const Redis = (await import("@/framework/Redis")).default;
        await Redis.connect();
        await Redis.ping();
        log.info("Redis 预热完成");
      } catch (err) {
        log.warn(
          { err },
          "Redis 预热失败（首次业务请求时会再连）"
        );
      }
    })()
  );

  tasks.push(
    (async () => {
      try {
        const { default: Db } = await import("@/framework/ORM");
        await Db.connect();
        log.info("数据源预热完成");
      } catch (err) {
        log.warn(
          { err },
          "数据源预热失败（首次查询时会再连）"
        );
      }
    })()
  );

  await Promise.all(tasks);
}
