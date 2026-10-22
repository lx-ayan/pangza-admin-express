import Redis from "../Redis";
import {
  READ_LOCK_ACQUIRE_LUA,
  READ_LOCK_UNLOCK_LUA,
  WRITE_LOCK_ACQUIRE_LUA,
  WRITE_LOCK_UNLOCK_LUA,
} from "./scripts";
import { RedissonLock } from "./RLock";
import type { RedissonConfig, RLock, RReadWriteLock } from "./types";
import { defaultRedissonConfig } from "./types";
import { channelName, evalNumber, evalScript } from "./utils";

export class RedissonReadWriteLock implements RReadWriteLock {
  private readonly read: RLock;
  private readonly write: RLock;

  constructor(
    name: string,
    clientId: string,
    config: Required<RedissonConfig> = defaultRedissonConfig
  ) {
    const storage = `${name}:rwlock`;
    const key = () => Redis.key(storage);
    const ch = () => channelName(storage);
    const field = (threadId: string) => `${clientId}:${threadId}`;

    this.read = new RedissonLock(
      `${name}:read`,
      clientId,
      config,
      {
        acquire: (threadId, leaseMs) =>
          evalNumber(READ_LOCK_ACQUIRE_LUA, [key()], [
            leaseMs,
            field(threadId),
          ]),
        unlock: async (threadId, leaseMs) => {
          const result = await evalScript(
            READ_LOCK_UNLOCK_LUA,
            [key(), ch()],
            ["0", field(threadId), leaseMs]
          );
          if (result === null || result === undefined) return null;
          return Number(result);
        },
      },
      storage
    );

    this.write = new RedissonLock(
      `${name}:write`,
      clientId,
      config,
      {
        acquire: (threadId, leaseMs) =>
          evalNumber(WRITE_LOCK_ACQUIRE_LUA, [key()], [
            leaseMs,
            field(threadId),
          ]),
        unlock: async (threadId, leaseMs) => {
          const result = await evalScript(
            WRITE_LOCK_UNLOCK_LUA,
            [key(), ch()],
            ["0", field(threadId), leaseMs]
          );
          if (result === null || result === undefined) return null;
          return Number(result);
        },
      },
      storage
    );
  }

  readLock(): RLock {
    return this.read;
  }

  writeLock(): RLock {
    return this.write;
  }
}
