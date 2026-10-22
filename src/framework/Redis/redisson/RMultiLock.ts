import { LockError } from "../errors";
import type { RLock } from "./types";

/**
 * 联锁：按顺序加锁，失败则回滚已加锁。
 */
export class RedissonMultiLock implements RLock {
  readonly name: string;

  constructor(private readonly locks: RLock[]) {
    if (!locks.length) throw new LockError("MultiLock 至少需要一把锁");
    this.name = locks.map((l) => l.name).join(",");
  }

  async lock(leaseTimeMs?: number): Promise<void> {
    const ok = await this.tryLock(-1, leaseTimeMs);
    if (!ok) throw new LockError(`获取联锁失败: ${this.name}`);
  }

  async tryLock(waitTimeMs?: number, leaseTimeMs?: number): Promise<boolean> {
    const acquired: RLock[] = [];
    try {
      for (const lock of this.locks) {
        const ok = await lock.tryLock(waitTimeMs, leaseTimeMs);
        if (!ok) {
          for (const a of acquired.reverse()) {
            try {
              await a.unlock();
            } catch {
              // ignore
            }
          }
          return false;
        }
        acquired.push(lock);
      }
      return true;
    } catch (e) {
      for (const a of acquired.reverse()) {
        try {
          await a.unlock();
        } catch {
          // ignore
        }
      }
      throw e;
    }
  }

  async unlock(): Promise<void> {
    for (const lock of [...this.locks].reverse()) {
      await lock.unlock();
    }
  }

  async forceUnlock(): Promise<boolean> {
    let any = false;
    for (const lock of [...this.locks].reverse()) {
      if (await lock.forceUnlock()) any = true;
    }
    return any;
  }

  async isLocked(): Promise<boolean> {
    for (const lock of this.locks) {
      if (!(await lock.isLocked())) return false;
    }
    return true;
  }

  async isHeldByCurrentThread(): Promise<boolean> {
    for (const lock of this.locks) {
      if (!(await lock.isHeldByCurrentThread())) return false;
    }
    return true;
  }

  async getHoldCount(): Promise<number> {
    let min = Number.POSITIVE_INFINITY;
    for (const lock of this.locks) {
      min = Math.min(min, await lock.getHoldCount());
    }
    return Number.isFinite(min) ? min : 0;
  }

  async remainTimeToLive(): Promise<number> {
    let min = Number.POSITIVE_INFINITY;
    for (const lock of this.locks) {
      min = Math.min(min, await lock.remainTimeToLive());
    }
    return Number.isFinite(min) ? min : -2;
  }
}
