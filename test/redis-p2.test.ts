import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Redis from "@/framework/Redis/Redis";

type FakeClient = {
  isReady: boolean;
  set: (
    k: string,
    v: string,
    opts?: { NX?: boolean; PX?: number; EX?: number }
  ) => Promise<string | null>;
  eval: (
    script: string,
    opts: { keys: string[]; arguments: string[] }
  ) => Promise<number>;
};

function installFakeClient(fake: FakeClient): () => void {
  const prev = (Redis as any).client;
  (Redis as any).client = fake;
  (Redis as any).connecting = null;
  return () => {
    (Redis as any).client = prev;
  };
}

describe("Redis P2 unlockIfMatch / setNxPx", () => {
  it("unlockIfMatch：value 匹配才删除", async () => {
    const store = new Map<string, string>();
    const restore = installFakeClient({
      isReady: true,
      async set(k, v, opts) {
        if (opts?.NX && store.has(k)) return null;
        store.set(k, v);
        return "OK";
      },
      async eval(_script, opts) {
        const k = opts.keys[0]!;
        const expect = opts.arguments[0]!;
        if (store.get(k) === expect) {
          store.delete(k);
          return 1;
        }
        return 0;
      },
    });

    try {
      const k = "lock:p2";
      const full = Redis.key(k);
      store.set(full, "token-a");
      assert.equal(await Redis.unlockIfMatch(k, "wrong"), false);
      assert.ok(store.has(full));
      assert.equal(await Redis.unlockIfMatch(k, "token-a"), true);
      assert.ok(!store.has(full));
    } finally {
      restore();
    }
  });

  it("setNxPx 第二次返回 false", async () => {
    const store = new Map<string, string>();
    const restore = installFakeClient({
      isReady: true,
      async set(k, v, opts) {
        if (opts?.NX && store.has(k)) return null;
        store.set(k, v);
        return "OK";
      },
      async eval() {
        return 0;
      },
    });

    try {
      assert.equal(await Redis.setNxPx("nx:p2", "1", 1000), true);
      assert.equal(await Redis.setNxPx("nx:p2", "1", 1000), false);
    } finally {
      restore();
    }
  });

  it("rateLimit Lua 使用 pttl：无 TTL 时设置 expire", async () => {
    const store = new Map<string, { v: number; ttl: number }>();
    const restore = installFakeClient({
      isReady: true,
      async set() {
        return "OK";
      },
      async eval(script, opts) {
        assert.match(script, /pttl/i);
        const k = opts.keys[0]!;
        const time = Number(opts.arguments[0]);
        const count = Number(opts.arguments[1]);
        const cur = store.get(k);
        if (cur && cur.v > count) return cur.v;
        const next = (cur?.v ?? 0) + 1;
        const ttl = cur?.ttl ?? -1;
        if (ttl < 0) {
          store.set(k, { v: next, ttl: time });
        } else {
          store.set(k, { v: next, ttl });
        }
        return next;
      },
    });

    try {
      const n1 = await Redis.rateLimit("rl:p2", 10, 3);
      assert.equal(n1, 1);
      const n2 = await Redis.rateLimit("rl:p2", 10, 3);
      assert.equal(n2, 2);
      assert.equal(store.get(Redis.key("rl:p2"))?.ttl, 10);
    } finally {
      restore();
    }
  });
});
