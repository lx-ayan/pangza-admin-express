# Redisson 风格 API

基于现有 `Redis` 连接，提供接近 [Redisson](https://github.com/redisson/redisson) 的分布式锁与常用对象。入口：`Redisson` / `createRedisson()`。

## 锁

```ts
import { Redisson } from "@/framework";

const lock = Redisson.getLock("order:pay");

// 看门狗续期（默认 30s，每 10s 续一次）
await lock.lock();
try {
  // ...
} finally {
  await lock.unlock();
}

// 固定租约 10s（不启看门狗）
await lock.lock(10_000);

// 最多等 5s，租约 3s
const ok = await lock.tryLock(5000, 3000);

// 快捷
await Redisson.withLock("job", async () => { /* ... */ });
```

| API | 说明 |
|-----|------|
| `getLock` | 可重入锁 + pub/sub 唤醒 + 看门狗 |
| `getFairLock` | 公平锁（等待队列） |
| `getReadWriteLock` | `readLock()` / `writeLock()` |
| `getMultiLock(...locks)` | 联锁 |

## 同步器

- `getSemaphore(name)` — `trySetPermits` / `acquire` / `release`
- `getCountDownLatch(name)` — `trySetCount` / `countDown` / `await`

## 对象

`getAtomicLong` / `getBucket` / `getMap` / `getSet` / `getList` / `getScoredSortedSet` / `getTopic` / `getRateLimiter` / `getBitSet` / `getQueue`

## 配置

```ts
Redisson.configure({ lockWatchdogTimeout: 30_000, lockWatchInterval: 50 });
// 或
const client = createRedisson({ lockWatchdogTimeout: 20_000 });
```

## 说明

- 不是完整 Java Redisson 移植；不含 RedLock 跨多 Redis 节点。
- 简易 `Redis.tryLock` / `withLock` 仍保留；复杂场景优先用 `Redisson.getLock`。
