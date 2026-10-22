/** Redis TLS（可选；生产跨网建议开启） */
export interface RedisTlsConfig {
  /** 是否启用 TLS，默认 false */
  enabled?: boolean;
  /** 拒绝对端证书校验（仅内网自签调试；生产勿开） */
  rejectUnauthorized?: boolean;
  /** CA / cert / key 文件路径（可选） */
  ca?: string;
  cert?: string;
  key?: string;
}

/** 集群节点 */
export interface RedisNodeEndpoint {
  host: string;
  port?: number;
}

/** Cluster 配置（mode=cluster） */
export interface RedisClusterConfig {
  /** 用于发现拓扑的种子节点（建议 ≥1，生产建议 ≥3） */
  nodes?: RedisNodeEndpoint[];
  /** 只读命令是否打到副本 */
  useReplicas?: boolean;
}

/** Sentinel 配置（mode=sentinel） */
export interface RedisSentinelConfig {
  /** 主节点名称（sentinel monitor 里的 name） */
  name?: string;
  /** Sentinel 节点列表 */
  nodes?: RedisNodeEndpoint[];
}

/** 连接模式 */
export type RedisMode = "standalone" | "cluster" | "sentinel";

/** Redis 连接配置 */
export interface RedisConfig {
  /** 主机，默认 127.0.0.1（standalone） */
  host?: string;
  /** 端口，默认 6379 */
  port?: number;
  /** 密码，无密码可不传 */
  password?: string;
  /** ACL 用户名（Redis 6+）；空则不传 */
  username?: string;
  /** 数据库编号，默认 0（cluster 忽略） */
  db?: number;
  /** key 统一前缀，便于隔离环境 */
  keyPrefix?: string;
  /** 连接超时（毫秒），默认 3000 */
  connectTimeout?: number;
  /**
   * 断线重连：true（默认）指数退避；false 不重连。
   * 最大重试间隔见 maxReconnectDelay。
   */
  reconnect?: boolean;
  /** 重连最大间隔（毫秒），默认 10000 */
  maxReconnectDelay?: number;
  /** TLS */
  tls?: RedisTlsConfig;
  /** 连接模式，默认 standalone */
  mode?: RedisMode;
  /** Cluster（mode=cluster） */
  cluster?: RedisClusterConfig;
  /** Sentinel（mode=sentinel） */
  sentinel?: RedisSentinelConfig;
}

/** 默认配置 */
export const defaultRedisConfig: Required<
  Pick<
    RedisConfig,
    | "host"
    | "port"
    | "db"
    | "keyPrefix"
    | "connectTimeout"
    | "reconnect"
    | "maxReconnectDelay"
    | "mode"
  >
> &
  RedisConfig = {
  host: "127.0.0.1",
  port: 6379,
  db: 0,
  keyPrefix: "pangza:",
  connectTimeout: 3000,
  reconnect: true,
  maxReconnectDelay: 10000,
  mode: "standalone",
};

/** 限流维度 */
export const RateLimiterType = {
  DEFAULT: "DEFAULT",
  IP: "IP",
  USER: "USER",
} as const;

export type RateLimiterTypeValue =
  (typeof RateLimiterType)[keyof typeof RateLimiterType];

/** 限流窗口算法 */
export type RateLimitMode = "fixed" | "sliding";

/** @RateLimiter / option.rateLimit */
export interface RateLimitOption {
  /** 时间窗口（秒），默认 2 */
  time?: number;
  /** 窗口内最大次数，默认 1 */
  count?: number;
  /** Redis key 前缀，默认 rateLimiter: */
  key?: string;
  /** DEFAULT=全局；IP=按客户端 IP；USER=按登录用户 */
  type?: RateLimiterTypeValue | "DEFAULT" | "IP" | "USER";
  /** fixed=固定窗口（默认）；sliding=滑动窗口（ZSET） */
  mode?: RateLimitMode;
}

/** @RepeatSubmit / option.repeatSubmit */
export interface RepeatSubmitOption {
  /** 间隔（毫秒），默认 3000 */
  interval?: number;
  /** 提示文案 */
  message?: string;
}

/** @Cacheable */
export interface CacheableOption {
  /** key 前缀；默认 cache:{Class}.{method} */
  key?: string;
  /** 过期秒数；默认 60；≤0 永不过期 */
  ttl?: number;
  /**
   * 自定义 key 后缀：接收方法参数，返回字符串。
   * 默认 JSON.stringify(args)。
   */
  keyGenerator?: (...args: unknown[]) => string;
}

/** @CacheEvict */
export interface CacheEvictOption {
  /** 与 @Cacheable 相同的 key 前缀；默认 cache:{Class}.{method} */
  key?: string;
  /** 自定义后缀；默认 JSON.stringify(args) */
  keyGenerator?: (...args: unknown[]) => string;
  /** true：删除整个前缀下匹配（SCAN+DEL，谨慎） */
  allEntries?: boolean;
}

/** tryLock / withLock */
export interface TryLockOption {
  /** 锁过期（毫秒），默认 30000 */
  ttlMs?: number;
  /** 锁 token；默认随机 */
  token?: string;
}

export interface WithLockOption extends TryLockOption {
  /** 续租间隔（毫秒）；默认 ttlMs/3；≤0 不续租 */
  renewIntervalMs?: number;
}

/** 已持有的锁句柄 */
export interface LockHandle {
  key: string;
  token: string;
  /** 安全释放（value 匹配才删） */
  release: () => Promise<boolean>;
  /** 手动续期（毫秒） */
  renew: (ttlMs: number) => Promise<boolean>;
}

export const RATE_LIMIT_KEY = "rateLimiter:";
export const REPEAT_SUBMIT_KEY = "repeat:submit:";
export const CACHE_KEY = "cache:";
export const LOCK_KEY = "lock:";
