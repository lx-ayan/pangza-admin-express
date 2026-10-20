import "reflect-metadata";
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import Db from "@/framework/ORM/Db";
import { BaseMapper } from "@/framework/ORM/BaseMapper";
import { QueryWrapper } from "@/framework/ORM/QueryWrapper";
import { configureOrm, getOrmConfig } from "@/framework/ORM/config";
import { clearTableCache } from "@/framework/ORM/table";
import { Transactional } from "@/framework/ORM/transactional";
import { getDialect } from "@/framework/ORM/dialect";

describe("P2 QueryWrapper groupBy / having / 大 IN", () => {
  afterEach(() => {
    configureOrm({ batchInSize: undefined as unknown as number });
    clearTableCache();
  });

  it("groupBy + having 生成片段，params 顺序正确", () => {
    const frag = new QueryWrapper()
      .eq("tenant_id", 1)
      .select("status")
      .groupBy("status")
      .having("COUNT(*) > ?", [2])
      .orderByAsc("status")
      .build();
    assert.equal(frag.selectSql, "`status`");
    assert.match(frag.whereSql, /`tenant_id` = \?/);
    assert.equal(frag.groupSql, "GROUP BY `status`");
    assert.equal(frag.havingSql, "HAVING COUNT(*) > ?");
    assert.match(frag.orderSql, /ORDER BY `status` ASC/);
    assert.deepEqual(frag.params, [1, 2]);
  });

  it("clone 保留 groupBy / having", () => {
    const w = new QueryWrapper()
      .groupBy("a")
      .having("SUM(x) > ?", [9]);
    const frag = w.clone().build();
    assert.equal(frag.groupSql, "GROUP BY `a`");
    assert.equal(frag.havingSql, "HAVING SUM(x) > ?");
    assert.deepEqual(frag.params, [9]);
  });

  it("大 IN 按 batchInSize 分片", () => {
    configureOrm({ batchInSize: 2 });
    const values = [1, 2, 3, 4, 5];
    const frag = new QueryWrapper().in("id", values).build();
    assert.match(
      frag.whereSql,
      /`id` IN \(\?, \?\) OR `id` IN \(\?, \?\) OR `id` IN \(\?\)/
    );
    assert.deepEqual(frag.params, values);

    const notFrag = new QueryWrapper().notIn("id", values).build();
    assert.match(
      notFrag.whereSql,
      /`id` NOT IN \(\?, \?\) AND `id` NOT IN \(\?, \?\) AND `id` NOT IN \(\?\)/
    );
  });
});

describe("P2 BaseMapper updateBatch / 批次配置 / group SELECT", () => {
  let calls: Array<{ sql: string; params: unknown[] }> = [];
  let originalQueryOn: typeof Db.queryOn;
  let originalTxOn: typeof Db.transactionOn;

  beforeEach(() => {
    clearTableCache();
    configureOrm({
      logicDelete: false,
      fillCreateTime: undefined,
      fillUpdateTime: undefined,
      fillCreateBy: undefined,
      fillUpdateBy: undefined,
      sqlLog: false,
      idType: "INPUT",
    });
    calls = [];
    originalQueryOn = Db.queryOn.bind(Db);
    originalTxOn = Db.transactionOn.bind(Db);
    Db.ensureDefault();

    Db.queryOn = (async (_n: string, sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      const compact = sql.replace(/\s+/g, " ").trim();
      if (/^SHOW COLUMNS/i.test(compact) || /information_schema/i.test(compact)) {
        return [
          { Field: "id" },
          { Field: "name" },
          { Field: "n" },
          { Field: "status" },
        ];
      }
      if (/AS _g/i.test(compact) || /^SELECT COUNT/i.test(compact)) {
        return [{ cnt: 3 }];
      }
      if (/^SELECT\b/i.test(compact)) {
        return [];
      }
      if (/^INSERT\b/i.test(compact)) {
        return { insertId: 0, affectedRows: params.length > 0 ? 1 : 0 };
      }
      if (/^UPDATE\b/i.test(compact) || /^DELETE\b/i.test(compact)) {
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }) as typeof Db.queryOn;

    Db.transactionOn = (async (_n: string, fn: () => Promise<unknown>) =>
      fn()) as typeof Db.transactionOn;
  });

  afterEach(() => {
    Db.queryOn = originalQueryOn;
    Db.transactionOn = originalTxOn;
    configureOrm({});
    clearTableCache();
  });

  it("selectList 带 GROUP BY / HAVING", async () => {
    const mapper = new BaseMapper({
      table: "t",
      logicDelete: false,
      fill: false,
    });
    await mapper.selectList(
      new QueryWrapper()
        .select("status")
        .groupBy("status")
        .having("COUNT(*) > ?", [1])
    );
    const sel = calls.find(
      (c) => /^SELECT\b/i.test(c.sql) && /GROUP BY/i.test(c.sql)
    );
    assert.ok(sel);
    assert.match(sel!.sql, /GROUP BY `status`/);
    assert.match(sel!.sql, /HAVING COUNT\(\*\) > \?/);
    assert.deepEqual(sel!.params, [1]);
  });

  it("selectCount 有 GROUP BY 时用子查询", async () => {
    const mapper = new BaseMapper({
      table: "t",
      logicDelete: false,
      fill: false,
    });
    await mapper.selectCount(
      new QueryWrapper().groupBy("status").having("COUNT(*) > ?", [0])
    );
    const cnt = calls.find((c) => /AS _g/i.test(c.sql));
    assert.ok(cnt);
    assert.match(cnt!.sql, /SELECT COUNT\(1\) AS cnt FROM \(SELECT 1 FROM/);
    assert.match(cnt!.sql, /GROUP BY/);
  });

  it("updateBatch 逐条 UPDATE 并汇总影响行数", async () => {
    const mapper = new BaseMapper({
      table: "t",
      logicDelete: false,
      fill: false,
    });
    const n = await mapper.updateBatch([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
    assert.equal(n, 2);
    const updates = calls.filter((c) => /^UPDATE\b/i.test(c.sql));
    assert.equal(updates.length, 2);
  });

  it("saveBatch / deleteByIds 使用配置批次", async () => {
    configureOrm({ batchInsertSize: 2, batchInSize: 2, idType: "INPUT" });
    assert.equal(getOrmConfig().batchInsertSize, 2);
    assert.equal(getOrmConfig().batchInSize, 2);

    const mapper = new BaseMapper({
      table: "t",
      logicDelete: false,
      fill: false,
      idField: "id",
    });

    await mapper.saveBatch([
      { id: "1", n: 1 },
      { id: "2", n: 2 },
      { id: "3", n: 3 },
    ]);
    const inserts = calls.filter((c) => /^INSERT\b/i.test(c.sql));
    assert.ok(
      inserts.length >= 2,
      `期望至少 2 批 INSERT，实际 ${inserts.length}`
    );

    calls.length = 0;
    await mapper.deleteByIds([1, 2, 3, 4]);
    const deletes = calls.filter((c) => /^DELETE\b/i.test(c.sql));
    assert.equal(deletes.length, 2);
  });
});

describe("P2 REQUIRES_NEW 与类型别名", () => {
  afterEach(() => {
    Db.usePoolForTest(null as unknown as object);
  });

  it("REQUIRES_NEW 嵌套在 REQUIRED 内会再 begin/commit", async () => {
    let begins = 0;
    let commits = 0;
    Db.usePoolForTest({
      async query() {
        return [];
      },
      async getConnection() {
        return {
          async query() {
            return [];
          },
          async begin() {
            begins += 1;
          },
          async commit() {
            commits += 1;
          },
          async rollback() {},
          release() {},
        };
      },
      async end() {},
    });

    class Svc {
      @Transactional({ propagation: "REQUIRES_NEW" })
      async audit() {
        assert.equal(Db.inTransaction(), true);
      }

      @Transactional()
      async outer() {
        await this.audit();
      }
    }

    await new Svc().outer();
    assert.equal(begins, 2);
    assert.equal(commits, 2);
  });

  it("方言类型别名 pg / mssql / mariadb", () => {
    assert.equal(getDialect("pg").type, "postgresql");
    assert.equal(getDialect("postgres").type, "postgresql");
    assert.equal(getDialect("mssql").type, "sqlserver");
    assert.equal(getDialect("sql-server").type, "sqlserver");
    assert.equal(getDialect("mariadb").type, "mysql");
  });
});
