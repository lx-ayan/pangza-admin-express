import { createClient } from "redis";
import { redisConfig } from "@/config";
import { defaultRedisConfig, type RedisConfig } from "./types";

/** 创建 RESP2 客户端，兼容不支持 HELLO 的旧版 Redis */
function createRedisClient(options: {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}) {
  return createClient({
    RESP: 2,
    socket: {
      host: options.host,
      port: options.port,
    },
    password: options.password || undefined,
    database: options.db,
  });
}

type RedisClient = ReturnType<typeof createRedisClient>;

/**
 * Redis 操作封装（基于 node-redis v6）。
 * 配置来自 .env，模块加载及首次调用时自动连接，无需手动 connect。
 *
 * 用法：
 *   await Redis.set('a', '1', 60)
 *   const v = await Redis.get('a')
 */
class Redis {
  private static client: RedisClient | null = null;
  private static config: RedisConfig = {
    ...defaultRedisConfig,
    ...redisConfig,
  };
  private static connecting: Promise<void> | null = null;

  /** 确保已连接；各业务方法内部调用 */
  private static async ensureReady(): Promise<RedisClient> {
    if (!this.client?.isReady) {
      await this.connect();
    }
    if (!this.client?.isReady) {
      throw new Error("Redis 连接不可用，请检查 .env 中的 Redis 配置");
    }
    return this.client;
  }

  /** 覆盖配置（一般不需要，默认已读 .env） */
  static configure(config: RedisConfig = {}): void {
    this.config = {
      ...defaultRedisConfig,
      ...this.config,
      ...config,
    };
  }

  /** 是否已连接 */
  static isReady(): boolean {
    return !!this.client?.isReady;
  }

  /** 连接 Redis（可重复调用；业务侧通常不必手动调用） */
  static async connect(config?: RedisConfig): Promise<void> {
    if (config) this.configure(config);
    if (this.client?.isReady) return;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      const { host, port, password, db } = {
        ...defaultRedisConfig,
        ...this.config,
      };

      const client = createRedisClient({ host, port, password, db });

      client.on("error", (err) => {
        console.error("[Redis] error:", err.message);
      });

      await client.connect();
      this.client = client;
      console.log(`[Redis] 已连接 ${host}:${port} db=${db ?? 0}`);
    })();

    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  /** 断开连接 */
  static async disconnect(): Promise<void> {
    if (!this.client) return;
    await this.client.quit();
    this.client = null;
  }

  /** 获取原生 client（高级用法，会先自动连接） */
  static async getClient(): Promise<RedisClient> {
    return this.ensureReady();
  }

  /** 拼接业务 key（自动加前缀） */
  static key(raw: string): string {
    const prefix = this.config.keyPrefix ?? defaultRedisConfig.keyPrefix;
    return raw.startsWith(prefix) ? raw : `${prefix}${raw}`;
  }

  /** 设置字符串；ttlSeconds 存在时设置过期秒数 */
  static async set(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<void> {
    const client = await this.ensureReady();
    const k = this.key(key);
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(k, value, { EX: ttlSeconds });
    } else {
      await client.set(k, value);
    }
  }

  /** 设置 JSON 对象 */
  static async setJSON(
    key: string,
    value: unknown,
    ttlSeconds?: number
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /** 获取字符串 */
  static async get(key: string): Promise<string | null> {
    const client = await this.ensureReady();
    return client.get(this.key(key));
  }

  /** 获取并解析 JSON；不存在或解析失败返回 null */
  static async getJSON<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /** 删除一个或多个 key，返回删除数量 */
  static async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    const client = await this.ensureReady();
    return client.del(keys.map((k) => this.key(k)));
  }

  /** key 是否存在 */
  static async exists(key: string): Promise<boolean> {
    const client = await this.ensureReady();
    const n = await client.exists(this.key(key));
    return n > 0;
  }

  /** 设置过期时间（秒） */
  static async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const client = await this.ensureReady();
    const result = await client.expire(this.key(key), ttlSeconds);
    return Number(result) === 1;
  }

  /** 剩余生存时间（秒）；-1 永不过期，-2 不存在 */
  static async ttl(key: string): Promise<number> {
    const client = await this.ensureReady();
    return client.ttl(this.key(key));
  }

  /** 仅当 key 不存在时设置（分布式锁常用） */
  static async setNX(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<boolean> {
    const client = await this.ensureReady();
    const k = this.key(key);
    const result = await client.set(k, value, {
      NX: true,
      ...(ttlSeconds && ttlSeconds > 0 ? { EX: ttlSeconds } : {}),
    });
    return result === "OK";
  }

  /** Hash：设置字段 */
  static async hSet(
    key: string,
    field: string,
    value: string
  ): Promise<number> {
    const client = await this.ensureReady();
    return client.hSet(this.key(key), field, value);
  }

  /** Hash：获取字段 */
  static async hGet(key: string, field: string): Promise<string | undefined> {
    const client = await this.ensureReady();
    const v = await client.hGet(this.key(key), field);
    return v ?? undefined;
  }

  /** Hash：获取全部字段 */
  static async hGetAll(key: string): Promise<Record<string, string>> {
    const client = await this.ensureReady();
    return client.hGetAll(this.key(key));
  }

  /** Hash：删除字段 */
  static async hDel(key: string, ...fields: string[]): Promise<number> {
    if (fields.length === 0) return 0;
    const client = await this.ensureReady();
    return client.hDel(this.key(key), fields);
  }

  /** Set：添加成员 */
  static async sAdd(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    const client = await this.ensureReady();
    return client.sAdd(this.key(key), members);
  }

  /** Set：获取全部成员 */
  static async sMembers(key: string): Promise<string[]> {
    const client = await this.ensureReady();
    return client.sMembers(this.key(key));
  }

  /** Set：移除成员 */
  static async sRem(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    const client = await this.ensureReady();
    return client.sRem(this.key(key), members);
  }

  /** 自增 */
  static async incr(key: string): Promise<number> {
    const client = await this.ensureReady();
    return client.incr(this.key(key));
  }

  /** 自减 */
  static async decr(key: string): Promise<number> {
    const client = await this.ensureReady();
    return client.decr(this.key(key));
  }
}

// 按 .env 配置在模块加载时自动连接
void Redis.connect().catch((err: Error) => {
  console.error("[Redis] 自动连接失败:", err.message);
});

export default Redis;
export type { RedisConfig } from "./types";
