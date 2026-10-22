import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Redis from "@/framework/Redis/Redis";
import { LockError } from "@/framework/Redis/errors";
import { createRedisson } from "@/framework/Redis/redisson/Redisson";
import {
  LOCK_ACQUIRE_LUA,
  LOCK_FORCE_UNLOCK_LUA,
  LOCK_RENEW_LUA,
  LOCK_UNLOCK_LUA,
  SEMAPHORE_RELEASE_LUA,
  SEMAPHORE_TRY_ACQUIRE_LUA,
} from "@/framework/Redis/redisson/scripts";

type HashStore = Map<string, Map<string, string>>;

function installLockFake() {
  const hashes: HashStore = new Map();
  const strings = new Map<string, string>();
  const ttls = new Map<string, number>();

  function h(key: string): Map<string, string> {
    let m = hashes.get(key);
    if (!m) {
      m = new Map();
      hashes.set(key, m);
    }
    return m;
  }

  const fake = {
    isReady: true,
    async eval(
      script: string,
      opts: { keys: string[]; arguments: string[] }
    ): Promise<number | null> {
      const key = opts.keys[0]!;
      const args = opts.arguments;

      if (script === LOCK_ACQUIRE_LUA) {
        const lease = Number(args[0]);
        const field = args[1]!;
        const map = h(key);
        if (map.size === 0) {
          map.set(field, "1");
          ttls.set(key, lease);
          return null;
        }
        if (map.has(field)) {
          map.set(field, String(Number(map.get(field)) + 1));
          ttls.set(key, lease);
          return null;
        }
        return ttls.get(key) ?? 1000;
      }

      if (script === LOCK_RENEW_LUA) {
        const field = args[1]!;
        if (h(key).has(field)) {
          ttls.set(key, Number(args[0]));
          return 1;
        }
        return 0;
      }

      if (script === LOCK_UNLOCK_LUA) {
        const field = args[2]!;
        const map = h(key);
        if (!map.has(field)) return null;
        const next = Number(map.get(field)) - 1;
        if (next > 0) {
          map.set(field, String(next));
          return 0;
        }
        map.delete(field);
        if (map.size === 0) hashes.delete(key);
        return 1;
      }

      if (script === LOCK_FORCE_UNLOCK_LUA) {
        if (hashes.has(key) || strings.has(key)) {
          hashes.delete(key);
          strings.delete(key);
          return 1;
        }
        return 0;
      }

      if (script === SEMAPHORE_TRY_ACQUIRE_LUA) {
        const permits = Number(args[1]);
        const available = Number(strings.get(key) ?? args[0] ?? 0);
        if (available >= permits) {
          strings.set(key, String(available - permits));
          return 1;
        }
        return 0;
      }

      if (script === SEMAPHORE_RELEASE_LUA) {
        const available = Number(strings.get(key) ?? 0) + Number(args[0]);
        strings.set(key, String(available));
        return available;
      }

      return 0;
    },
    async exists(key: string) {
      return hashes.has(key) || strings.has(key) ? 1 : 0;
    },
    async hExists(key: string, field: string) {
      return h(key).has(field) ? 1 : 0;
    },
    async hGet(key: string, field: string) {
      return h(key).get(field) ?? null;
    },
    async pTTL(key: string) {
      return ttls.get(key) ?? -2;
    },
    async get(key: string) {
      return strings.get(key) ?? null;
    },
    async set(key: string, value: string, opts?: { NX?: boolean; EX?: number }) {
      if (opts?.NX && strings.has(key)) return null;
      strings.set(key, value);
      return "OK";
    },
    async getSet(key: string, value: string) {
      const prev = strings.get(key) ?? null;
      strings.set(key, value);
      return prev;
    },
    async del(keys: string | string[]) {
      const list = Array.isArray(keys) ? keys : [keys];
      let n = 0;
      for (const k of list) {
        if (hashes.delete(k) || strings.delete(k)) n++;
      }
      return n;
    },
    async incr(key: string) {
      const v = Number(strings.get(key) ?? 0) + 1;
      strings.set(key, String(v));
      return v;
    },
    async incrBy(key: string, delta: number) {
      const v = Number(strings.get(key) ?? 0) + delta;
      strings.set(key, String(v));
      return v;
    },
    async publish() {
      return 0;
    },
  };

  const prev = (Redis as any).client;
  (Redis as any).client = fake;
  (Redis as any).connecting = null;
  const origSub = Redis.subscribe.bind(Redis);
  Redis.subscribe = (async () => async () => {}) as typeof Redis.subscribe;

  return {
    restore() {
      (Redis as any).client = prev;
      Redis.subscribe = origSub;
    },
  };
}

describe("Redisson RLock", () => {
  it("可重入加锁 / 解锁", async () => {
    const ctx = installLockFake();
    try {
      const redisson = createRedisson({ lockWatchdogTimeout: 5000 });
      const lock = redisson.getLock("order:1");
      assert.equal(await lock.tryLock(0, 3000), true);
      assert.equal(await lock.tryLock(0, 3000), true);
      assert.equal(await lock.getHoldCount(), 2);
      assert.equal(await lock.isHeldByCurrentThread(), true);
      await lock.unlock();
      assert.equal(await lock.getHoldCount(), 1);
      await lock.unlock();
      assert.equal(await lock.isLocked(), false);
    } finally {
      ctx.restore();
    }
  });

  it("非持有者 unlock 抛 LockError", async () => {
    const ctx = installLockFake();
    try {
      const a = createRedisson();
      const b = createRedisson();
      const lockA = a.getLock("x");
      const lockB = b.getLock("x");
      assert.equal(await lockA.tryLock(0, 2000), true);
      await assert.rejects(
        () => lockB.unlock(),
        (e: unknown) => e instanceof LockError
      );
      await lockA.unlock();
    } finally {
      ctx.restore();
    }
  });

  it("withLock 执行并释放", async () => {
    const ctx = installLockFake();
    try {
      const redisson = createRedisson();
      const v = await redisson.withLock("job", async () => 42, 2000);
      assert.equal(v, 42);
      assert.equal(await redisson.getLock("job").isLocked(), false);
    } finally {
      ctx.restore();
    }
  });

  it("MultiLock 联锁", async () => {
    const ctx = installLockFake();
    try {
      const r = createRedisson();
      const multi = r.getMultiLock(r.getLock("a"), r.getLock("b"));
      assert.equal(await multi.tryLock(0, 2000), true);
      assert.equal(await multi.isLocked(), true);
      await multi.unlock();
    } finally {
      ctx.restore();
    }
  });
});

describe("Redisson objects", () => {
  it("AtomicLong / Bucket / Semaphore", async () => {
    const ctx = installLockFake();
    try {
      const r = createRedisson();
      const atomic = r.getAtomicLong("n");
      assert.equal(await atomic.incrementAndGet(), 1);
      assert.equal(await atomic.addAndGet(2), 3);

      const bucket = r.getBucket<{ x: number }>("b");
      assert.equal(await bucket.trySet({ x: 1 }), true);
      assert.equal(await bucket.trySet({ x: 2 }), false);
      assert.deepEqual(await bucket.get(), { x: 1 });

      const sem = r.getSemaphore("s");
      assert.equal(await sem.trySetPermits(2), true);
      assert.equal(await sem.tryAcquire(1, 0), true);
      assert.equal(await sem.availablePermits(), 1);
      await sem.release(1);
      assert.equal(await sem.availablePermits(), 2);
    } finally {
      ctx.restore();
    }
  });
});
