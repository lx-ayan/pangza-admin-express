import { AsyncLocalStorage } from "async_hooks";
import { getLogger } from "@/framework/Logger";
import { getDialect, type DbType, type Dialect } from "./dialect";

const log = getLogger("ORM");

/** 数据源连接配置 */
export interface DataSourceConfig {
  /** 数据源名称，默认 default */
  name?: string;
  /** 数据库类型，默认 mysql */
  type?: DbType | string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  connectionLimit?: number;
  /** SQL Server 加密等扩展项 */
  options?: Record<string, unknown>;
}

export type { DbType, Dialect };

interface TxConnection {
  query: (sql: string, params: unknown[]) => Promise<unknown>;
  begin: () => Promise<void>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  release: () => void;
}

interface PoolDriver {
  query: (sql: string, params: unknown[]) => Promise<unknown>;
  getConnection: () => Promise<TxConnection>;
  end: () => Promise<void>;
}

/**
 * 单个命名数据源：连接池 + 方言 + 事务 ALS。
 */
export class DataSource {
  readonly name: string;
  readonly type: DbType;
  readonly dialect: Dialect;
  readonly config: Required<
    Pick<
      DataSourceConfig,
      "host" | "port" | "user" | "password" | "database" | "connectionLimit"
    >
  > &
    DataSourceConfig;

  private driver: PoolDriver | null = null;
  private connecting: Promise<void> | null = null;
  private suppressConnect = false;
  private readonly txStore = new AsyncLocalStorage<TxConnection>();

  constructor(config: DataSourceConfig = {}) {
    this.name = (config.name ?? "default").trim() || "default";
    this.dialect = getDialect(config.type ?? "mysql");
    this.type = this.dialect.type;
    this.config = {
      host: config.host ?? "127.0.0.1",
      port:
        config.port ??
        (this.type === "postgresql"
          ? 5432
          : this.type === "sqlserver"
            ? 1433
            : 3306),
      user: config.user ?? "root",
      password: config.password ?? "",
      database: config.database ?? "pangza",
      connectionLimit: config.connectionLimit ?? 10,
      ...config,
      name: this.name,
      type: this.type,
    };
  }

  /** 测试注入 */
  useDriverForTest(driver: PoolDriver | null): void {
    this.suppressConnect = true;
    this.driver = driver;
  }

  isReady(): boolean {
    return !!this.driver;
  }

  inTransaction(): boolean {
    return !!this.txStore.getStore();
  }

  async connect(): Promise<void> {
    if (this.suppressConnect) return;
    if (this.driver) return;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      if (this.suppressConnect) return;
      this.driver = await createDriver(this.type, this.config);
      // 探活
      await this.driver.query(
        this.type === "postgresql" ? "SELECT 1 AS ok" : "SELECT 1 AS ok",
        []
      );
      log.info(
        `[${this.name}] 已连接 ${this.type} ${this.config.host}:${this.config.port}/${this.config.database}`
      );
    })();

    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.driver) return;
    await this.driver.end();
    this.driver = null;
  }

  private async ensureReady(): Promise<PoolDriver> {
    if (!this.driver) await this.connect();
    if (!this.driver) {
      throw new Error(
        `数据源 [${this.name}] 不可用，请检查配置 (type=${this.type})`
      );
    }
    return this.driver;
  }

  /** 执行 SQL（自动按方言转换占位符） */
  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T> {
    const executable = this.dialect.convertPlaceholders(sql);
    const tx = this.txStore.getStore();
    if (tx) {
      return (await tx.query(executable, params)) as T;
    }
    const driver = await this.ensureReady();
    return (await driver.query(executable, params)) as T;
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    const current = this.txStore.getStore();
    if (current) {
      return fn();
    }
    const driver = await this.ensureReady();
    const conn = await driver.getConnection();
    try {
      await conn.begin();
      const result = await this.txStore.run(conn, () => fn());
      await conn.commit();
      return result;
    } catch (err) {
      try {
        await conn.rollback();
      } catch {
        // ignore
      }
      throw err;
    } finally {
      conn.release();
    }
  }
}

async function createDriver(
  type: DbType,
  config: DataSource["config"]
): Promise<PoolDriver> {
  if (type === "mysql") {
    return createMysqlDriver(config);
  }
  if (type === "postgresql") {
    return createPgDriver(config);
  }
  return createMssqlDriver(config);
}

async function createMysqlDriver(
  config: DataSource["config"]
): Promise<PoolDriver> {
  const mysql = await import("mysql2/promise");
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
    waitForConnections: true,
    namedPlaceholders: false,
  });

  return {
    async query(sql, params) {
      const [rows] = await pool.execute(sql, params as any[]);
      return rows;
    },
    async getConnection() {
      const conn = await pool.getConnection();
      return {
        async query(sql, params) {
          const [rows] = await conn.execute(sql, params as any[]);
          return rows;
        },
        async begin() {
          await conn.beginTransaction();
        },
        async commit() {
          await conn.commit();
        },
        async rollback() {
          await conn.rollback();
        },
        release() {
          conn.release();
        },
      };
    },
    async end() {
      await pool.end();
    },
  };
}

async function createPgDriver(
  config: DataSource["config"]
): Promise<PoolDriver> {
  const pg = await import("pg");
  const pool = new pg.Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    max: config.connectionLimit,
  });

  return {
    async query(sql, params) {
      const res = await pool.query(sql, params as any[]);
      // SELECT / RETURNING → rows；DML → 兼容 header
      if (Array.isArray(res.rows) && res.rows.length > 0) {
        return res.rows;
      }
      if (/^\s*(INSERT|UPDATE|DELETE)/i.test(sql)) {
        return {
          insertId: 0,
          affectedRows: res.rowCount ?? 0,
          rowCount: res.rowCount ?? 0,
          rows: res.rows,
        };
      }
      return res.rows;
    },
    async getConnection() {
      const client = await pool.connect();
      return {
        async query(sql, params) {
          const res = await client.query(sql, params as any[]);
          if (Array.isArray(res.rows) && res.rows.length > 0) {
            return res.rows;
          }
          if (/^\s*(INSERT|UPDATE|DELETE)/i.test(sql)) {
            return {
              insertId: 0,
              affectedRows: res.rowCount ?? 0,
              rowCount: res.rowCount ?? 0,
              rows: res.rows,
            };
          }
          return res.rows;
        },
        async begin() {
          await client.query("BEGIN");
        },
        async commit() {
          await client.query("COMMIT");
        },
        async rollback() {
          await client.query("ROLLBACK");
        },
        release() {
          client.release();
        },
      };
    },
    async end() {
      await pool.end();
    },
  };
}

async function createMssqlDriver(
  config: DataSource["config"]
): Promise<PoolDriver> {
  const sql = await import("mssql");
  const pool = await new sql.ConnectionPool({
    server: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      ...(config.options ?? {}),
    },
    pool: {
      max: config.connectionLimit,
      min: 0,
    },
  } as any).connect();

  const run = async (request: any, sqlText: string, params: unknown[]) => {
    params.forEach((value, idx) => {
      request.input(`p${idx + 1}`, value as any);
    });
    const result = await request.query(sqlText);
    if (Array.isArray(result.recordset) && result.recordset.length > 0) {
      return result.recordset;
    }
    const affected = Array.isArray(result.rowsAffected)
      ? Number(result.rowsAffected[0] ?? 0)
      : 0;
    return {
      insertId: 0,
      affectedRows: affected,
      rowsAffected: result.rowsAffected,
      rows: result.recordset ?? [],
    };
  };

  return {
    async query(sqlText, params) {
      const request = pool.request();
      return run(request, sqlText, params);
    },
    async getConnection() {
      const tx = new sql.Transaction(pool);
      let begun = false;
      return {
        async query(sqlText, params) {
          const request = new sql.Request(tx);
          return run(request, sqlText, params);
        },
        async begin() {
          await tx.begin();
          begun = true;
        },
        async commit() {
          if (begun) await tx.commit();
          begun = false;
        },
        async rollback() {
          if (begun) await tx.rollback();
          begun = false;
        },
        release() {
          // ConnectionPool 事务结束后无需手动 release
        },
      };
    },
    async end() {
      await pool.close();
    },
  };
}
