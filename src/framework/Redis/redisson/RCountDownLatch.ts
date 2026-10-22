import Redis from "../Redis";
import { COUNTDOWN_COUNTDOWN_LUA } from "./scripts";
import type { RCountDownLatch } from "./types";
import { channelName, evalNumber, sleep, waitNotify } from "./utils";

export class RedissonCountDownLatch implements RCountDownLatch {
  constructor(readonly name: string) {}

  private key(): string {
    return Redis.key(`countdown:${this.name}`);
  }

  private channel(): string {
    return channelName(`countdown:${this.name}`);
  }

  async trySetCount(count: number): Promise<boolean> {
    return Redis.setNX(`countdown:${this.name}`, String(Math.max(0, count)));
  }

  async getCount(): Promise<number> {
    const v = await Redis.get(`countdown:${this.name}`);
    return v == null ? 0 : Number(v);
  }

  async countDown(): Promise<void> {
    await evalNumber(
      COUNTDOWN_COUNTDOWN_LUA,
      [this.key(), this.channel()],
      []
    );
  }

  async await(waitTimeMs = -1): Promise<boolean> {
    const deadline =
      waitTimeMs < 0
        ? Number.POSITIVE_INFINITY
        : Date.now() + Math.max(0, waitTimeMs);

    for (;;) {
      const c = await this.getCount();
      if (c <= 0) return true;
      if (Date.now() >= deadline) return false;
      const remain = Math.max(0, deadline - Date.now());
      const notified = await waitNotify(this.channel(), Math.min(remain, 2000));
      if (!notified) await sleep(Math.min(50, remain));
    }
  }
}
