import { withSqlLog } from "./sqlLog";
import {
  DataSource,
  type DataSourceConfig,
  type DbType,
  type Dialect,
} from "./DataSource";
import { getDialect } from "./dialect";
import {
  mssqlConfig,
  mysqlConfig,
  postgresqlConfig,
} from "@/framework/config";

export type { DataSourceConfig, DbType, Dialect };
export { DataSource, getDialect };

/** 兼容旧类型名 */
export type MysqlConfig = DataSourceConfig;

/**
 * 多数据源门面（默认名 default）。
 *
 * @example
 * // 默认库（项目根目录 application*.yaml 的 datasource.default）
 * await Db.query("SELECT 1")
 *
 * // 注册 PostgreSQL
 * Db.register("pg", { type: "postgresql", host: "127.0.0.1", database: "app", user: "postgres", password: "x" })
 * await Db.queryOn("pg", 'SELECT * FROM "user" WHERE id = ?', [1])
 *
 * // Mapper / 装饰器指定数据源
 * @Mapper(UserEntity, { datasource: "pg" })
 * @Select("SELECT ...", { datasource: "pg" })
 */
class Db {
  private static readonly sources = new Map<string, DataSource>();
  private static readonly DEFAULT = "default";

  /** 注册或覆盖数据源 */
  static register(nameOrConfig: string | DataSourceConfig, config?: DataSourceConfig): DataSource {
    let name: string;
    let cfg: DataSourceConfig;
    if (typeof nameOrConfig === "string") {
      name = nameOrConfig.trim() || this.DEFAULT;
      cfg = { ...(config ?? {}), name };
    } else {
      cfg = { ...nameOrConfig };
      name = (cfg.name ?? this.DEFAULT).trim() || this.DEFAULT;
      cfg.name = name;
    }
    const ds = new DataSource(cfg);
    this.sources.set(name, ds);
    return ds;
  }

  /** 确保默认数据源（来自 YAML datasource.default）；并按需注册 postgresql / sqlserver */
  static ensureDefault(): DataSource {
    if (!this.sources.has(this.DEFAULT)) {
      this.register(this.DEFAULT, {
        name: this.DEFAULT,
        type: mysqlConfig.type || "mysql",
        host: mysqlConfig.host,
        port: mysqlConfig.port,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
        database: mysqlConfig.database,
        connectionLimit: mysqlConfig.connectionLimit,
      });
    }
    this.registerOptionalFromEnv();
    return this.sources.get(this.DEFAULT)!;
  }

  /** YAML 中 postgresql / sqlserver 的 host 非空时自动注册命名数据源 */
  private static registerOptionalFromEnv(): void {
    if (postgresqlConfig.host && !this.sources.has("postgresql")) {
      this.register("postgresql", {
        name: "postgresql",
        type: "postgresql",
        host: postgresqlConfig.host,
        port: postgresqlConfig.port,
        user: postgresqlConfig.user,
        password: postgresqlConfig.password,
        database: postgresqlConfig.database,
        connectionLimit: postgresqlConfig.connectionLimit,
      });
    }
    if (mssqlConfig.host && !this.sources.has("sqlserver")) {
      this.register("sqlserver", {
        name: "sqlserver",
        type: "sqlserver",
        host: mssqlConfig.host,
        port: mssqlConfig.port,
        user: mssqlConfig.user,
        password: mssqlConfig.password,
        database: mssqlConfig.database,
        connectionLimit: mssqlConfig.connectionLimit,
      });
    }
  }

  static getDataSource(name: string = this.DEFAULT): DataSource {
    if (name === this.DEFAULT) {
      return this.ensureDefault();
    }
    const ds = this.sources.get(name);
    if (!ds) {
      this.ensureDefault();
      const registered = [...this.sources.keys()].join(", ") || "(无)";
      throw new Error(
        `未注册数据源 [${name}]。已注册: ${registered}。请先 Db.register("${name}", { type, host, ... })`
      );
    }
    return ds;
  }

  /** 按数据库类型查找唯一数据源（用于 @Select({ db: "postgresql" })） */
  static findByType(type: DbType | string): string {
    this.ensureDefault();
    const dialect = getDialect(type);
    const matched = [...this.sources.entries()].filter(
      ([, ds]) => ds.type === dialect.type
    );
    if (matched.length === 0) {
      throw new Error(`没有已注册的 ${dialect.type} 数据源`);
    }
    if (matched.length > 1) {
      throw new Error(
        `存在多个 ${dialect.type} 数据源 (${matched
          .map(([n]) => n)
          .join(", ")})，请用 datasource 指定名称`
      );
    }
    return matched[0]![0];
  }

  static getDialect(name: string = this.DEFAULT): Dialect {
    return this.getDataSource(name).dialect;
  }

  static listDataSources(): string[] {
    this.ensureDefault();
    return [...this.sources.keys()];
  }

  /** @deprecated 使用 register；保留覆盖默认连接配置 */
  static configure(config: DataSourceConfig = {}): void {
    this.register(this.DEFAULT, {
      type: mysqlConfig.type || "mysql",
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      password: mysqlConfig.password,
      database: mysqlConfig.database,
      connectionLimit: mysqlConfig.connectionLimit,
      ...config,
      name: this.DEFAULT,
    });
  }

  static isReady(name: string = this.DEFAULT): boolean {
    return this.sources.get(name)?.isReady() ?? false;
  }

  /** 测试注入默认池驱动 */
  static usePoolForTest(pool: unknown): void {
    const ds = this.ensureDefault();
    // 兼容旧测试：传入 mysql2 Pool
    if (pool && typeof (pool as any).execute === "function") {
      const mysqlPool = pool as {
        execute: (sql: string, params?: any[]) => Promise<[unknown, unknown]>;
        getConnection: () => Promise<any>;
        end: () => Promise<void>;
      };
      ds.useDriverForTest({
        async query(sql, params) {
          const [rows] = await mysqlPool.execute(sql, params as any[]);
          return rows;
        },
        async getConnection() {
          const conn = await mysqlPool.getConnection();
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
          await mysqlPool.end();
        },
      });
      return;
    }
    ds.useDriverForTest(pool as any);
  }

  static async connect(config?: DataSourceConfig): Promise<void> {
    if (config) this.configure(config);
    await this.ensureDefault().connect();
  }

  static async connectAll(): Promise<void> {
    this.ensureDefault();
    await Promise.all([...this.sources.values()].map((ds) => ds.connect()));
  }

  static async disconnect(name?: string): Promise<void> {
    if (name) {
      await this.sources.get(name)?.disconnect();
      return;
    }
    await Promise.all([...this.sources.values()].map((ds) => ds.disconnect()));
  }

  static inTransaction(name: string = this.DEFAULT): boolean {
    return this.getDataSource(name).inTransaction();
  }

  /** 默认数据源执行 SQL */
  static async query<T = unknown>(
    sql: string,
    params: unknown[] = []
  ): Promise<T> {
    return this.queryOn(this.DEFAULT, sql, params);
  }

  /** 指定数据源执行 SQL */
  static async queryOn<T = unknown>(
    datasource: string,
    sql: string,
    params: unknown[] = []
  ): Promise<T> {
    return withSqlLog(sql, params, async () => {
      const ds = this.getDataSource(datasource);
      return ds.query<T>(sql, params);
    });
  }

  static async getPool(): Promise<unknown> {
    await this.ensureDefault().connect();
    return this.ensureDefault();
  }

  static async transaction<T>(
    fn: () => Promise<T>,
    options?: { propagation?: "REQUIRED" | "REQUIRES_NEW" }
  ): Promise<T> {
    return this.transactionOn(this.DEFAULT, fn, options);
  }

  static async transactionOn<T>(
    datasource: string,
    fn: () => Promise<T>,
    options?: { propagation?: "REQUIRED" | "REQUIRES_NEW" }
  ): Promise<T> {
    return this.getDataSource(datasource).transaction(fn, options);
  }
}

// 兼容旧导出类型名（mysql2）
export type ResultSetHeader = {
  insertId?: number;
  affectedRows?: number;
  rowCount?: number;
  rowsAffected?: number[];
  rows?: unknown[];
};
export type RowDataPacket = Record<string, any>;
export type PoolConnection = unknown;

export default Db;
