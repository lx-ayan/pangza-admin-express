import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Request } from "express";
import Redis from "@/framework/Redis/Redis";
import { applyRateLimit } from "@/framework/Redis/rateLimit";
import { Cacheable, CacheEvict } from "@/framework/Redis/cache";
import { GuardError, LockError } from "@/framework/Redis/errors";
import { RateLimiterType } from "@/framework/Redis/types";

type FakeClient = {
  isReady: boolean;
  set: (
    k: string,
    v: string,
    opts?: { NX?: boolean; PX?: number; EX?: number }
  ) => Promise<string | null>;
  get: (k: string) => Promise<string | null>;
  del: (keys: string | string[]) => Promise<number>;
  eval: (
    script: string,
    opts: { keys: string[]; arguments: string[] }
  ) => Promise<number>;
  ping?: () => Promise<string>;
  lPush?: (k: string, v: string[]) => Promise<number>;
  lRange?: (k: string, start: number, stop: number) => Promise<string[]>;
  zAdd?: (
    k: string,
    members: Array<{ score: number; value: string }>
  ) => Promise<number>;
  zCard?: (k: string) => Promise<number>;
  multi?: () => {
    set: (k: string, v: string) => unknown;
    get: (k: string) => unknown;
    exec: () => Promise<unknown[]>;
  };
  publish?: (ch: string, msg: string) => Promise<number>;
  scan?: (
    cursor: string,
    opts: { MATCH: string; COUNT: number }
  ) => Promise<{ cursor: string; keys: string[] }>;
};

function installFake(fake: FakeClient): () => void {
  const prev = (Redis as any).client;
  (Redis as any).client = fake;
  (Redis as any).connecting = null;
  return () => {
    (Redis as any).client = prev;
  };
}

describe("Redis ping / lock / structures", () => {
  it("ping 返回 true", async () => {
    const restore = installFake({
      isReady: true,
      async set() {
        return "OK";
      },
      async get() {
        return null;
      },
      async del() {
        return 0;
      },
      async eval() {
        return 0;
      },
      async ping() {
        return "PONG";
      },
    });
    try {
      assert.equal(await Redis.ping(), true);
    } finally {
      restore();
    }
  });

  it("tryLock / unlockIfMatch / renewIfMatch", async () => {
    const store = new Map<string, string>();
    const restore = installFake({
      isReady: true,
      async set(k, v, opts) {
        if (opts?.NX && store.has(k)) return null;
        store.set(k, v);
        return "OK";
      },
      async get(k) {
        return store.get(k) ?? null;
      },
      async del(keys) {
        const list = Array.isArray(keys) ? keys : [keys];
        let n = 0;
        for (const k of list) {
          if (store.delete(k)) n++;
        }
        return n;
      },
      async eval(script, opts) {
        const k = opts.keys[0]!;
        const token = opts.arguments[0]!;
        if (script.includes("pexpire")) {
          if (store.get(k) === token) return 1;
          return 0;
        }
        if (store.get(k) === token) {
          store.delete(k);
          return 1;
        }
        return 0;
      },
    });
    try {
      const h1 = await Redis.tryLock("job:a", { ttlMs: 1000, token: "t1" });
      assert.ok(h1);
      assert.equal(await Redis.tryLock("job:a", { ttlMs: 1000 }), null);
      assert.equal(await h1!.renew(2000), true);
      assert.equal(await h1!.release(), true);
      assert.equal(await Redis.tryLock("job:a", { ttlMs: 1000, token: "t2" }) != null, true);
    } finally {
      restore();
    }
  });

  it("withLock 拿不到锁抛 LockError", async () => {
    const store = new Map<string, string>();
    const restore = installFake({
      isReady: true,
      async set(k, v, opts) {
        if (opts?.NX && store.has(k)) return null;
        store.set(k, v);
        return "OK";
      },
      async get() {
        return null;
      },
      async del() {
        return 0;
      },
      async eval() {
        return 1;
      },
    });
    try {
      store.set(Redis.key("lock:busy"), "x");
      await assert.rejects(
        () => Redis.withLock("busy", async () => 1, { renewIntervalMs: 0 }),
        (e: unknown) => e instanceof LockError
      );
    } finally {
      restore();
    }
  });

  it("List / ZSet / pipeline / publish", async () => {
    const lists = new Map<string, string[]>();
    const zsets = new Map<string, Array<{ score: number; value: string }>>();
    const restore = installFake({
      isReady: true,
      async set() {
        return "OK";
      },
      async get() {
        return null;
      },
      async del() {
        return 0;
      },
      async eval() {
        return 0;
      },
      async lPush(k, values) {
        const arr = lists.get(k) ?? [];
        arr.unshift(...values);
        lists.set(k, arr);
        return arr.length;
      },
      async lRange(k, start, stop) {
        const arr = lists.get(k) ?? [];
        const end = stop < 0 ? arr.length : stop + 1;
        return arr.slice(start, end);
      },
      async zAdd(k, members) {
        const arr = zsets.get(k) ?? [];
        arr.push(...members);
        zsets.set(k, arr);
        return members.length;
      },
      async zCard(k) {
        return (zsets.get(k) ?? []).length;
      },
      multi() {
        const ops: unknown[] = [];
        const api = {
          set(k: string, v: string) {
            ops.push(["set", k, v]);
            return api;
          },
          get(k: string) {
            ops.push(["get", k]);
            return api;
          },
          async exec() {
            return ops.map(() => "OK");
          },
        };
        return api;
      },
      async publish() {
        return 1;
      },
    });
    try {
      await Redis.lPush("q", "a", "b");
      assert.deepEqual(await Redis.lRange("q", 0, -1), ["a", "b"]);
      await Redis.zAdd("rank", [{ score: 1, value: "u1" }]);
      assert.equal(await Redis.zCard("rank"), 1);
      const pipe = await Redis.pipeline((m) => {
        m.set(Redis.key("p:a"), "1");
        m.get(Redis.key("p:a"));
      });
      assert.equal(pipe.length, 2);
      assert.equal(await Redis.publish("ch", "hi"), 1);
    } finally {
      restore();
    }
  });
});

describe("RateLimit USER / sliding", () => {
  it("sliding 超限抛 GuardError", async () => {
    let calls = 0;
    const original = Redis.rateLimitSliding.bind(Redis);
    Redis.rateLimitSliding = (async () => {
      calls += 1;
      return calls;
    }) as typeof Redis.rateLimitSliding;
    try {
      const req = { path: "/x" } as Request;
      await applyRateLimit(
        { time: 10, count: 1, mode: "sliding", type: RateLimiterType.DEFAULT },
        req,
        { controllerName: "C", handlerName: "h" }
      );
      await assert.rejects(
        () =>
          applyRateLimit(
            {
              time: 10,
              count: 1,
              mode: "sliding",
              type: RateLimiterType.DEFAULT,
            },
            req,
            { controllerName: "C", handlerName: "h" }
          ),
        (e: unknown) => e instanceof GuardError
      );
    } finally {
      Redis.rateLimitSliding = original;
    }
  });

  it("USER 维度 key 含用户段", async () => {
    const keys: string[] = [];
    const original = Redis.rateLimit.bind(Redis);
    Redis.rateLimit = (async (key: string) => {
      keys.push(key);
      return 1;
    }) as typeof Redis.rateLimit;
    const { AuthUtil } = await import("@/framework/Auth");
    const origGet = AuthUtil.getLoginIdDefaultNull.bind(AuthUtil);
    AuthUtil.getLoginIdDefaultNull = (async () => "u42") as typeof AuthUtil.getLoginIdDefaultNull;
    try {
      await applyRateLimit(
        { time: 2, count: 5, type: RateLimiterType.USER },
        { path: "/a" } as Request,
        { controllerName: "Demo", handlerName: "list" }
      );
      assert.ok(keys[0]?.includes("u42-"));
      assert.ok(keys[0]?.includes("Demo-list"));
    } finally {
      Redis.rateLimit = original;
      AuthUtil.getLoginIdDefaultNull = origGet;
    }
  });
});

describe("Cacheable / CacheEvict", () => {
  it("命中缓存不重复执行", async () => {
    const store = new Map<string, string>();
    const restore = installFake({
      isReady: true,
      async set(k, v) {
        store.set(k, v);
        return "OK";
      },
      async get(k) {
        return store.get(k) ?? null;
      },
      async del(keys) {
        const list = Array.isArray(keys) ? keys : [keys];
        let n = 0;
        for (const k of list) {
          if (store.delete(k)) n++;
        }
        return n;
      },
      async eval() {
        return 0;
      },
    });

    let runs = 0;
    class Svc {
      @Cacheable({ ttl: 60, key: "cache:demo.get" })
      async get(id: string) {
        runs += 1;
        return { id, n: runs };
      }

      @CacheEvict({ key: "cache:demo.get" })
      async clear(id: string) {
        return id;
      }
    }

    try {
      const s = new Svc();
      const a = await s.get("1");
      const b = await s.get("1");
      assert.deepEqual(a, b);
      assert.equal(runs, 1);
      await s.clear("1");
      const c = await s.get("1");
      assert.equal(runs, 2);
      assert.equal(c.n, 2);
    } finally {
      restore();
    }
  });
});
