/** Redis 连接配置 */
export interface RedisConfig {
  /** 主机，默认 127.0.0.1 */
  host?: string;
  /** 端口，默认 6379 */
  port?: number;
  /** 密码，无密码可不传 */
  password?: string;
  /** 数据库编号，默认 0 */
  db?: number;
  /** key 统一前缀，便于隔离环境 */
  keyPrefix?: string;
}

/** 默认配置 */
export const defaultRedisConfig: Required<
  Pick<RedisConfig, "host" | "port" | "db" | "keyPrefix">
> &
  RedisConfig = {
  host: "127.0.0.1",
  port: 6379,
  db: 0,
  keyPrefix: "pangza:",
};
