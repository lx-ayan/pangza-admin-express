import { AsyncLocalStorage } from "async_hooks";
import { randomBytes } from "crypto";
import Redis from "../Redis";

/** 每个 Redisson 客户端实例 id */
export function createClientId(): string {
  return `${process.pid}-${randomBytes(8).toString("hex")}`;
}

/** 异步上下文中的「线程」id，支撑可重入 */
const threadAls = new AsyncLocalStorage<string>();

let threadSeq = 0;

export function currentThreadId(clientId: string): string {
  const existing = threadAls.getStore();
  if (existing) return existing;
  threadSeq += 1;
  return `${clientId}:${threadSeq}`;
}

export async function runWithThreadIdAsync<T>(
  threadId: string,
  fn: () => Promise<T>
): Promise<T> {
  return threadAls.run(threadId, fn);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

export function channelName(lockName: string): string {
  return `pangza_lock_channel:{${lockName}}`;
}

/** keys 已是最终 Redis key（调用方负责前缀） */
export async function evalScript(
  script: string,
  keys: string[],
  args: Array<string | number>
): Promise<unknown> {
  const client = await Redis.getClient();
  return client.eval(script, {
    keys,
    arguments: args.map(String),
  });
}

export async function evalNumber(
  script: string,
  keys: string[],
  args: Array<string | number>
): Promise<number | null> {
  const result = await evalScript(script, keys, args);
  if (result === null || result === undefined) return null;
  return Number(result);
}

/** 等待 pub/sub 通知或超时 */
export async function waitNotify(
  channel: string,
  timeoutMs: number
): Promise<boolean> {
  if (timeoutMs <= 0) return false;
  let settled = false;
  let unsub: (() => Promise<void>) | null = null;
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      void unsub?.();
      resolve(false);
    }, timeoutMs);

    void Redis.subscribe(channel, () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void unsub?.();
      resolve(true);
    }).then((u) => {
      unsub = u;
      if (settled) void u();
    });
  });
}
