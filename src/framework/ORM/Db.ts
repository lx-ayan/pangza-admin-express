import { AsyncLocalStorage } from "async_hooks";
import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import { mysqlConfig } from "@/framework/config";
import { getLogger } from "@/framework/Logger";
import type { MysqlConfig } from "./types";
import { withSqlLog } from "./sqlLog";

const log = getLogger("MySQL");

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
  /** 测试注入连接池后，不再自动 connect */
  private static suppressConnect = false;
  /** 当前事务连接；@Transactional / Db.transaction 内的 query 走同一连接 */
  private static readonly txStore = new AsyncLocalStorage<PoolConnection>();
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

  /** 测试用：替换连接池并禁止自动建连 */
  static usePoolForTest(pool: Pool | null): void {
    this.suppressConnect = true;
    const prev = this.pool;
    this.pool = pool;
    if (prev && prev !== pool) {
      void Promise.resolve(prev.end()).catch(() => undefined);
    }
  }

  /** 创建连接池（可重复调用） */
  static async connect(config?: MysqlConfig): Promise<void> {
    if (this.suppressConnect) return;
    if (config) this.configure(config);
    if (this.pool) return;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      if (this.suppressConnect) return;
      const cfg = { ...defaultMysqlConfig, ...this.config };
      const pool = mysql.createPool({
        host: cfg.host,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
        connectionLimit: cfg.connectionLimit,
        waitForConnections: true,
        namedPlaceholders: false,
      });
      if (this.suppressConnect) {
        await pool.end();
        return;
      }
      this.pool = pool;
      const conn = await this.pool.getConnection();
      conn.release();
      log.info(`已连接 ${cfg.host}:${cfg.port}/${cfg.database}`);
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

  /** 当前调用栈是否已在事务中 */
  static inTransaction(): boolean {
    return !!this.txStore.getStore();
  }

  /** 执行 SQL，返回结果行或 ResultSetHeader（事务内走同一连接） */
  static async query<T = RowDataPacket[]>(
    sql: string,
    params: unknown[] = []
  ): Promise<T> {
    return withSqlLog(sql, params, async () => {
      const tx = this.txStore.getStore();
      if (tx) {
        const [rows] = await tx.execute(sql, params as any[]);
        return rows as T;
      }
      const pool = await this.ensureReady();
      const [rows] = await pool.execute(sql, params as any[]);
      return rows as T;
    });
  }

  /** 获取原生 pool（高级用法） */
  static async getPool(): Promise<Pool> {
    return this.ensureReady();
  }

  /**
   * 事务：自动 begin / commit / rollback。
   * 已在事务中时加入外层（不再 begin/commit），失败由外层统一回滚。
   * 事务内的 Db.query / BaseMapper 会自动使用同一连接。
   *
   * @example
   * await Db.transaction(async () => {
   *   await table("user").insert({ name: "a" });
   * });
   */
  static async transaction<T>(
    fn: (conn: PoolConnection) => Promise<T>
  ): Promise<T> {
    const current = this.txStore.getStore();
    if (current) {
      return fn(current);
    }

    const pool = await this.ensureReady();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await this.txStore.run(conn, () => fn(conn));
      await conn.commit();
      return result;
    } catch (err) {
      try {
        await conn.rollback();
      } catch {
        // 连接已断开时忽略二次错误，仍抛出原异常
      }
      throw err;
    } finally {
      conn.release();
    }
  }
}

export type { ResultSetHeader, RowDataPacket, PoolConnection };
export default Db;
