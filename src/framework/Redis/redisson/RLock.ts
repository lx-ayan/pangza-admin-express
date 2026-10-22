import Redis from "../Redis";
import { LockError } from "../errors";
import {
  LOCK_ACQUIRE_LUA,
  LOCK_FORCE_UNLOCK_LUA,
  LOCK_RENEW_LUA,
  LOCK_UNLOCK_LUA,
} from "./scripts";
import type { RedissonConfig, RLock } from "./types";
import { defaultRedissonConfig } from "./types";
import {
  channelName,
  currentThreadId,
  evalNumber,
  evalScript,
  runWithThreadIdAsync,
  sleep,
  waitNotify,
} from "./utils";

type AcquireFn = (
  threadId: string,
  leaseMs: number
) => Promise<number | null>;

type UnlockFn = (
  threadId: string,
  leaseMs: number
) => Promise<number | null>;

/**
 * Redisson 风格可重入分布式锁（Hash + 看门狗 + pub/sub 唤醒）。
 */
export class RedissonLock implements RLock {
  private readonly watchdogTimeout: number;
  private readonly watchInterval: number;
  private renewTimer: ReturnType<typeof setInterval> | null = null;
  private heldThreadId: string | null = null;
  private readonly doAcquire: AcquireFn;
  private readonly doUnlock: UnlockFn;

  constructor(
    readonly name: string,
    private readonly clientId: string,
    config: Required<RedissonConfig> = defaultRedissonConfig,
    hooks?: { acquire?: AcquireFn; unlock?: UnlockFn },
    /** Redis 存储名（默认与 name 相同；读写锁读写端共享） */
    private readonly storageName?: string
  ) {
    this.watchdogTimeout = config.lockWatchdogTimeout;
    this.watchInterval = config.lockWatchInterval;
    this.doAcquire =
      hooks?.acquire ??
      ((threadId, leaseMs) =>
        evalNumber(LOCK_ACQUIRE_LUA, [this.lockKey()], [
          leaseMs,
          this.field(threadId),
        ]));
    this.doUnlock =
      hooks?.unlock ??
      ((threadId, leaseMs) =>
        this.unlockInner(LOCK_UNLOCK_LUA, threadId, leaseMs));
  }

  protected lockKey(): string {
    return Redis.key(this.storageName ?? this.name);
  }

  protected channel(): string {
    return channelName(this.storageName ?? this.name);
  }

  protected field(threadId: string): string {
    return `${this.clientId}:${threadId}`;
  }

  private async unlockInner(
    script: string,
    threadId: string,
    leaseMs: number
  ): Promise<number | null> {
    const result = await evalScript(script, [this.lockKey(), this.channel()], [
      "0",
      leaseMs,
      this.field(threadId),
    ]);
    if (result === null || result === undefined) return null;
    return Number(result);
  }

  async lock(leaseTimeMs?: number): Promise<void> {
    const ok = await this.tryLock(-1, leaseTimeMs);
    if (!ok) throw new LockError(`获取锁失败: ${this.name}`);
  }

  /**
   * @param waitTimeMs 等待毫秒；undefined=0（立即）；-1=无限等
   * @param leaseTimeMs 租约；undefined/-1=看门狗
   */
  async tryLock(waitTimeMs?: number, leaseTimeMs?: number): Promise<boolean> {
    // 同一 RLock 实例已持有时复用 threadId，保证跨 await 可重入
    const threadId = this.heldThreadId ?? currentThreadId(this.clientId);
    return runWithThreadIdAsync(threadId, async () => {
      const wait = waitTimeMs === undefined ? 0 : waitTimeMs;
      const useWatchdog = leaseTimeMs === undefined || leaseTimeMs < 0;
      const lease = useWatchdog
        ? this.watchdogTimeout
        : Math.max(1, leaseTimeMs!);

      const deadline =
        wait < 0 ? Number.POSITIVE_INFINITY : Date.now() + Math.max(0, wait);

      for (;;) {
        const ttl = await this.doAcquire(threadId, lease);
        if (ttl === null) {
          this.heldThreadId = threadId;
          if (useWatchdog) this.scheduleWatchdog(threadId, lease);
          return true;
        }
        if (Date.now() >= deadline) return false;

        const remain = Math.min(
          Math.max(ttl > 0 ? ttl : this.watchInterval, this.watchInterval),
          Math.max(0, deadline - Date.now())
        );
        if (remain <= 0) return false;

        const notified = await waitNotify(
          this.channel(),
          Math.min(remain, 3000)
        );
        if (!notified) {
          await sleep(Math.min(this.watchInterval, remain));
        }
      }
    });
  }

  private scheduleWatchdog(threadId: string, leaseMs: number): void {
    this.cancelWatchdog();
    const every = Math.max(100, Math.floor(leaseMs / 3));
    this.renewTimer = setInterval(() => {
      void evalNumber(LOCK_RENEW_LUA, [this.lockKey()], [
        leaseMs,
        this.field(threadId),
      ]).then((ok) => {
        if (ok !== 1) this.cancelWatchdog();
      });
    }, every);
    if (typeof this.renewTimer === "object" && "unref" in this.renewTimer) {
      (this.renewTimer as NodeJS.Timeout).unref?.();
    }
  }

  private cancelWatchdog(): void {
    if (this.renewTimer) {
      clearInterval(this.renewTimer);
      this.renewTimer = null;
    }
  }

  async unlock(): Promise<void> {
    const threadId = this.heldThreadId ?? currentThreadId(this.clientId);
    const result = await this.doUnlock(threadId, this.watchdogTimeout);
    if (result === null) {
      throw new LockError(`无法解锁（非持有者）: ${this.name}`);
    }
    if (result === 1) {
      this.cancelWatchdog();
      this.heldThreadId = null;
    }
  }

  async forceUnlock(): Promise<boolean> {
    this.cancelWatchdog();
    this.heldThreadId = null;
    const n = await evalNumber(
      LOCK_FORCE_UNLOCK_LUA,
      [this.lockKey(), this.channel()],
      ["0"]
    );
    return n === 1;
  }

  async isLocked(): Promise<boolean> {
    const client = await Redis.getClient();
    const n = await client.exists(this.lockKey());
    return Number(n) > 0;
  }

  async isHeldByCurrentThread(): Promise<boolean> {
    const threadId = this.heldThreadId ?? currentThreadId(this.clientId);
    const client = await Redis.getClient();
    const n = await client.hExists(this.lockKey(), this.field(threadId));
    return Number(n) === 1;
  }

  async getHoldCount(): Promise<number> {
    const threadId = this.heldThreadId ?? currentThreadId(this.clientId);
    const client = await Redis.getClient();
    const v = await client.hGet(this.lockKey(), this.field(threadId));
    return v == null ? 0 : Number(v);
  }

  async remainTimeToLive(): Promise<number> {
    const client = await Redis.getClient();
    return client.pTTL(this.lockKey());
  }
}
