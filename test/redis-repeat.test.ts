import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import type { Request } from "express";
import Redis from "@/framework/Redis/Redis";
import { applyRepeatSubmit } from "@/framework/Redis/rateLimit";
import { GuardError } from "@/framework/Redis/errors";

describe("RepeatSubmit 原子占坑", () => {
  const keys: string[] = [];
  let originalSetNxPx: typeof Redis.setNxPx;

  beforeEach(() => {
    keys.length = 0;
    originalSetNxPx = Redis.setNxPx.bind(Redis);
    const store = new Map<string, string>();
    Redis.setNxPx = (async (key: string, value: string, _ttlMs: number) => {
      keys.push(key);
      if (store.has(key)) return false;
      store.set(key, value);
      return true;
    }) as typeof Redis.setNxPx;
  });

  afterEach(() => {
    Redis.setNxPx = originalSetNxPx;
  });

  function req(body: unknown): Request {
    return {
      body,
      query: {},
      originalUrl: "/api/demo",
      url: "/api/demo",
      path: "/api/demo",
    } as unknown as Request;
  }

  it("相同参数第二次失败", async () => {
    await applyRepeatSubmit({ interval: 3000 }, req({ a: 1 }));
    await assert.rejects(
      () => applyRepeatSubmit({ interval: 3000 }, req({ a: 1 })),
      (err: unknown) => err instanceof GuardError
    );
  });

  it("不同参数可分别通过", async () => {
    await applyRepeatSubmit({ interval: 3000 }, req({ a: 1 }));
    await applyRepeatSubmit({ interval: 3000 }, req({ a: 2 }));
    assert.equal(keys.length, 2);
    assert.notEqual(keys[0], keys[1]);
  });
});
