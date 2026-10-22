import Redis from "../Redis";
import { FAIR_LOCK_ACQUIRE_LUA, LOCK_UNLOCK_LUA } from "./scripts";
import { RedissonLock } from "./RLock";
import type { RedissonConfig } from "./types";
import { defaultRedissonConfig } from "./types";
import { evalNumber, evalScript } from "./utils";

/**
 * 公平锁：按等待队列顺序获取（简化版 Redisson FairLock）。
 */
export function createFairLock(
  name: string,
  clientId: string,
  config: Required<RedissonConfig> = defaultRedissonConfig
): RedissonLock {
  const queueKey = () => Redis.key(`${name}:fair:queue`);
  const timeoutPrefix = () => Redis.key(`${name}:fair:timeout:`);

  return new RedissonLock(name, clientId, config, {
    acquire: (threadId, leaseMs) =>
      evalNumber(
        FAIR_LOCK_ACQUIRE_LUA,
        [
          Redis.key(name),
          queueKey(),
          timeoutPrefix(),
        ],
        [leaseMs, `${clientId}:${threadId}`, Math.max(leaseMs * 2, 60_000)]
      ),
    unlock: async (threadId, leaseMs) => {
      const result = await evalScript(
        LOCK_UNLOCK_LUA,
        [Redis.key(name), `pangza_lock_channel:{${name}}`],
        ["0", leaseMs, `${clientId}:${threadId}`]
      );
      if (result === null || result === undefined) return null;
      return Number(result);
    },
  });
}
