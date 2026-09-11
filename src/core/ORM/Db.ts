import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import { mysqlConfig } from "@/config";
import type { MysqlConfig } from "./types";

const defaultMysqlConfig: Required<MysqlConfig> = {
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "pangza",
  connectionLimit: 10,
};

/**
 * 数据库连接封装（mysql2 pool）。
 * 配置来自 .env，首次查询时自动建连。
 */
class Db {
  private static pool: Pool | null = null;
  private static config: MysqlConfig = {
    ...defaultMysqlConfig,
    ...mysqlConfig,
  };
  private static connecting: Promise<void> | null = null;

  /** 覆盖配置（一般不需要） */
  static configure(config: MysqlConfig = {}): void {
    this.config = {
      ...defaultMysqlConfig,
      ...this.config,
      ...config,
    };
  }

  /** 是否已就绪 */
  static isReady(): boolean {
    return !!this.pool;
  }

  /** 创建连接池（可重复调用） */
  static async connect(config?: MysqlConfig): Promise<void> {
    if (config) this.configure(config);
    if (this.pool) return;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      const cfg = { ...defaultMysqlConfig, ...this.config };
      this.pool = mysql.createPool({
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
        connectionLimit: cfg.connectionLimit,
        waitForConnections: true,
        namedPlaceholders: false,
      });
      // 探活
      const conn = await this.pool.getConnection();
      conn.release();
      console.log(
        `[MySQL] 已连接 ${cfg.host}:${cfg.port}/${cfg.database}`
      );
    })();

    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  /** 关闭连接池 */
  static async disconnect(): Promise<void> {
    if (!this.pool) return;
    await this.pool.end();
    this.pool = null;
  }

  private static async ensureReady(): Promise<Pool> {
    if (!this.pool) await this.connect();
    if (!this.pool) {
      throw new Error("MySQL 连接不可用，请检查 .env 中的 MySQL 配置");
    }
    return this.pool;
  }

  /** 执行 SQL，返回结果行或 ResultSetHeader */
  static async query<T = RowDataPacket[]>(
    sql: string,
    params: unknown[] = []
  ): Promise<T> {
    const pool = await this.ensureReady();
    const [rows] = await pool.execute(sql, params as any[]);
    return rows as T;
  }

  /** 获取原生 pool（高级用法） */
  static async getPool(): Promise<Pool> {
    return this.ensureReady();
  }

  /**
   * 事务：自动 begin / commit / rollback
   * @example
   * await Db.transaction(async (conn) => {
   *   await conn.execute('UPDATE ...', []);
   * });
   */
  static async transaction<T>(
    fn: (conn: PoolConnection) => Promise<T>
  ): Promise<T> {
    const pool = await this.ensureReady();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

export type { ResultSetHeader, RowDataPacket, PoolConnection };
export default Db;
