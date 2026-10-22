import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Request } from "express";
import { getClientIp, normalizeIp } from "@/framework/Log/ip";
import { RedisStore, type RedisLike } from "@/framework/Auth/store";
import type { AuthSession } from "@/framework/Auth/types";

function fakeReq(partial: {
  headers?: Record<string, string | string[]>;
  remoteAddress?: string;
  ip?: string;
}): Request {
  return {
    headers: partial.headers ?? {},
    ip: partial.ip,
    socket: { remoteAddress: partial.remoteAddress },
    connection: { remoteAddress: partial.remoteAddress },
  } as unknown as Request;
}

describe("getClientIp trustProxy", () => {
  it("默认不信任 X-Forwarded-For，用 socket IP", () => {
    const ip = getClientIp(
      fakeReq({
        headers: { "x-forwarded-for": "1.2.3.4" },
        remoteAddress: "10.0.0.8",
      }),
      { trustProxy: false }
    );
    assert.equal(ip, "10.0.0.8");
  });

  it("trustProxy=true 时取 X-Forwarded-For 最左", () => {
    const ip = getClientIp(
      fakeReq({
        headers: { "x-forwarded-for": "8.8.8.8, 10.0.0.1" },
        remoteAddress: "10.0.0.8",
      }),
      { trustProxy: true }
    );
    assert.equal(ip, "8.8.8.8");
  });

  it("normalizeIp 处理 IPv6 映射", () => {
    assert.equal(normalizeIp("::ffff:192.168.1.1"), "192.168.1.1");
    assert.equal(normalizeIp("::1"), "127.0.0.1");
  });
});

describe("RedisStore uid set TTL", () => {
  it("set 时对 uid set expire，且不缩短已有更长 TTL", async () => {
    const calls: Array<{ op: string; key: string; arg?: unknown }> = [];
    let uidTtl = -2;
    const redis: RedisLike = {
      async setJSON(key, _v, ttl) {
        calls.push({ op: "setJSON", key, arg: ttl });
      },
      async getJSON() {
        return null;
      },
      async del() {
        return 0;
      },
      async sAdd(key, ..._m) {
        calls.push({ op: "sAdd", key });
        return 1;
      },
      async sMembers() {
        return [];
      },
      async sRem() {
        return 0;
      },
      async expire(key, ttl) {
        calls.push({ op: "expire", key, arg: ttl });
        uidTtl = ttl;
        return true;
      },
      async ttl(key) {
        calls.push({ op: "ttl", key });
        return uidTtl;
      },
    };

    const store = new RedisStore(redis);
    const base = Date.now();
    const session = (ttlSec: number, token: string): AuthSession => ({
      token,
      loginId: "u1",
      roles: [],
      permissions: [],
      createTime: base,
      expireTime: base + ttlSec * 1000,
      lastActiveTime: base,
    });

    await store.set(session(100, "t1"));
    assert.ok(calls.some((c) => c.op === "expire" && c.arg === 100));

    uidTtl = 80; // 剩余 80s
    calls.length = 0;
    await store.set(session(30, "t2")); // 更短，不应缩短
    assert.ok(!calls.some((c) => c.op === "expire"));

    calls.length = 0;
    await store.set(session(200, "t3")); // 更长，应延长
    assert.ok(calls.some((c) => c.op === "expire" && c.arg === 200));
  });

  it("listTokensByLoginId 清理幽灵 token", async () => {
    const members = new Set(["alive", "ghost"]);
    const redis: RedisLike = {
      async setJSON() {},
      async getJSON<T = unknown>(key: string): Promise<T | null> {
        if (String(key).includes("alive")) {
          return { token: "alive" } as T;
        }
        return null;
      },
      async del(...keys) {
        for (const k of keys) {
          if (String(k).includes("uid")) members.clear();
        }
        return keys.length;
      },
      async sAdd() {
        return 1;
      },
      async sMembers() {
        return [...members];
      },
      async sRem(_key, ...tokens) {
        for (const t of tokens) members.delete(t);
        return tokens.length;
      },
    };

    const store = new RedisStore(redis);
    const list = await store.listTokensByLoginId("u1");
    assert.deepEqual(list, ["alive"]);
    assert.ok(!members.has("ghost"));
    assert.ok(members.has("alive"));
  });
});
