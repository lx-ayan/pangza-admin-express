import { getLogger } from "@/framework/Logger";
import { isRedisEnabled } from "@/framework/Redis/flag";
import { isOrmEnabled } from "@/framework/ORM/flag";

const log = getLogger("Warmup");

/**
 * listen 之后按需预热：仅当已 registry EnableRedis / EnableOrm（或 Auth 绑定了 redis）时连接。
 * 未启用则跳过，避免无 Redis/MySQL 的用户被连接错误打扰。
 */
export async function warmupConnections(): Promise<void> {
  const tasks: Array<Promise<void>> = [];

  if (isRedisEnabled()) {
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
            "Redis 预热失败（已 EnableRedis，请检查配置；首次业务请求时会再连）",
          );
        }
      })(),
    );
  } else {
    log.debug("未 EnableRedis，跳过 Redis 预热");
  }

  if (isOrmEnabled()) {
    tasks.push(
      (async () => {
        try {
          const { default: Db } = await import("@/framework/ORM");
          await Db.connect();
          log.info("数据源预热完成");
        } catch (err) {
          log.warn(
            { err },
            "数据源预热失败（已 EnableOrm，请检查配置；首次查询时会再连）",
          );
        }
      })(),
    );
  } else {
    log.debug("未 EnableOrm，跳过数据源预热");
  }

  if (tasks.length === 0) return;
  await Promise.all(tasks);
}
