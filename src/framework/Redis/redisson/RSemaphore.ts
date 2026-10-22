import Redis from "../Redis";
import {
  SEMAPHORE_RELEASE_LUA,
  SEMAPHORE_TRY_ACQUIRE_LUA,
} from "./scripts";
import type { RSemaphore } from "./types";
import {
  channelName,
  evalNumber,
  evalScript,
  sleep,
  waitNotify,
} from "./utils";

export class RedissonSemaphore implements RSemaphore {
  constructor(readonly name: string) {}

  private key(): string {
    return Redis.key(`semaphore:${this.name}`);
  }

  private channel(): string {
    return channelName(`semaphore:${this.name}`);
  }

  async trySetPermits(permits: number): Promise<boolean> {
    return Redis.setNX(`semaphore:${this.name}`, String(Math.max(0, permits)));
  }

  async availablePermits(): Promise<number> {
    const v = await Redis.get(`semaphore:${this.name}`);
    return v == null ? 0 : Number(v);
  }

  async acquire(permits = 1): Promise<void> {
    const ok = await this.tryAcquire(permits, -1);
    if (!ok) throw new Error(`获取信号量失败: ${this.name}`);
  }

  async tryAcquire(permits = 1, waitTimeMs = 0): Promise<boolean> {
    const n = Math.max(1, permits);
    const deadline =
      waitTimeMs < 0
        ? Number.POSITIVE_INFINITY
        : Date.now() + Math.max(0, waitTimeMs);

    for (;;) {
      // ARGV[1]=初始值（仅当 key 不存在时用，这里传 0 表示不自动初始化）
      const ok = await evalNumber(
        SEMAPHORE_TRY_ACQUIRE_LUA,
        [this.key()],
        [0, n]
      );
      if (ok === 1) return true;
      if (Date.now() >= deadline) return false;
      const remain = Math.max(0, deadline - Date.now());
      const notified = await waitNotify(this.channel(), Math.min(remain, 2000));
      if (!notified) await sleep(Math.min(50, remain));
    }
  }

  async release(permits = 1): Promise<void> {
    await evalScript(
      SEMAPHORE_RELEASE_LUA,
      [this.key(), this.channel()],
      [Math.max(1, permits)]
    );
  }
}
