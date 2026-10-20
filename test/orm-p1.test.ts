import "reflect-metadata";
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import Db from "@/framework/ORM/Db";
import { BaseMapper } from "@/framework/ORM/BaseMapper";
import { QueryWrapper } from "@/framework/ORM/QueryWrapper";
import { getDialect } from "@/framework/ORM/dialect";
import { clearTableCache } from "@/framework/ORM/table";
import { configureOrm } from "@/framework/ORM/config";
import {
  OperTypeEnum,
  TableSearch,
  getQueryWrapper,
} from "@/framework/ORM/tableSearch";
import { IdType } from "@/framework/ORM/IdType";
import {
  TableId,
  TableName,
  getEntityIdField,
} from "@/framework/ORM/entityDecorators";
import { Transactional } from "@/framework/ORM/transactional";

describe("P1 QueryWrapper exists / 方言 LIKE", () => {
  it("exists / notExists", () => {
    const frag = new QueryWrapper()
      .exists("SELECT 1 FROM t2 WHERE t2.id = t.id AND t2.x = ?", [9])
      .notExists("SELECT 1 FROM t3 WHERE t3.id = t.id")
      .build();
    assert.match(frag.whereSql, /EXISTS \(SELECT 1 FROM t2/);
    assert.match(frag.whereSql, /NOT EXISTS \(SELECT 1 FROM t3/);
    assert.deepEqual(frag.params, [9]);
  });

  it("PG / MSSQL LIKE ESCAPE 与 MySQL 不同", () => {
    const mysql = new QueryWrapper({ dialect: "mysql" }).like("n", "a").build();
    const pg = new QueryWrapper({ dialect: "postgresql" }).like("n", "a").build();
    const mssql = new QueryWrapper({ dialect: "sqlserver" })
      .notLike("n", "a")
      .build();
    assert.match(mysql.whereSql, /ESCAPE '\\\\'/);
    assert.match(pg.whereSql, /ESCAPE '\\'/);
    assert.match(mssql.whereSql, /ESCAPE '\\'/);
    assert.equal(getDialect("postgresql").likeEscapeClause(), " ESCAPE '\\'");
  });
});

describe("P1 TableSearch 运算符", () => {
  class SearchDto {
    @TableSearch({ operator: OperTypeEnum.NOT_LIKE })
    name?: string;

    @TableSearch({ operator: OperTypeEnum.NOT_IN, column: "status" })
    statuses?: number[];

    @TableSearch({ operator: OperTypeEnum.BETWEEN, column: "age" })
    ageRange?: [number, number];

    @TableSearch({ operator: OperTypeEnum.IS_NOT_NULL, column: "email" })
    hasEmail?: boolean;
  }

  it("NOT_LIKE / NOT_IN / BETWEEN / IS_NOT_NULL", () => {
    const w = getQueryWrapper(
      {
        name: "x",
        statuses: [1, 2],
        ageRange: [10, 20],
        hasEmail: true,
      },
      SearchDto
    );
    const frag = w.build();
    assert.match(frag.whereSql, /NOT LIKE/);
    assert.match(frag.whereSql, /NOT IN/);
    assert.match(frag.whereSql, /BETWEEN/);
    assert.match(frag.whereSql, /IS NOT NULL/);
  });
});

describe("P1 BaseMapper saveOrUpdate / updateNullStrategy / insert 回写", () => {
  let calls: Array<{ sql: string; params: unknown[] }> = [];
  let originalQueryOn: typeof Db.queryOn;
  let originalTxOn: typeof Db.transactionOn;
  let rowsById: Map<string, Record<string, unknown>>;

  beforeEach(() => {
    clearTableCache();
    configureOrm({
      logicDelete: false,
      fillCreateTime: undefined,
      fillUpdateTime: undefined,
      fillCreateBy: undefined,
      fillUpdateBy: undefined,
      sqlLog: false,
      idType: "ASSIGN_ID",
    });
    calls = [];
    rowsById = new Map();
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
          { Field: "remark" },
          { Field: "delete_flag" },
        ];
      }
      if (/^SELECT COUNT/i.test(compact)) {
        return [{ cnt: rowsById.size }];
      }
      if (/^SELECT\b/i.test(compact) && /WHERE/i.test(compact)) {
        const id = params[0];
        const row = rowsById.get(String(id));
        return row ? [row] : [];
      }
      if (/^SELECT\b/i.test(compact)) {
        return [...rowsById.values()];
      }
      if (/^INSERT\b/i.test(compact)) {
        const colMatch = compact.match(/\(([^)]+)\)\s*VALUES/i);
        const cols = (colMatch?.[1] ?? "")
          .split(",")
          .map((c) => c.replace(/[`"]/g, "").trim());
        const row: Record<string, unknown> = {};
        cols.forEach((c, i) => {
          row[c] = params[i];
        });
        const id = String(row.id ?? "");
        rowsById.set(id, row);
        return { insertId: 0, affectedRows: 1 };
      }
      if (/^UPDATE\b/i.test(compact)) {
        const id = String(params[params.length - 1]);
        const prev = { ...(rowsById.get(id) ?? { id }) };
        const setPart = compact.split(/SET/i)[1]?.split(/WHERE/i)[0] ?? "";
        const setCols = [...setPart.matchAll(/`(\w+)`\s*=\s*\?/g)].map(
          (m) => m[1]
        );
        setCols.forEach((c, i) => {
          prev[c] = params[i];
        });
        rowsById.set(id, prev);
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
    clearTableCache();
  });

  it("saveOrUpdate：无主键 insert，有主键且存在则 update", async () => {
    const mapper = new BaseMapper({
      table: "demo",
      logicDelete: false,
      fill: false,
    });
    const e1: { id?: string; name?: string } = { name: "a" };
    await mapper.insert(e1);
    assert.ok(e1.id);
    assert.equal(rowsById.get(String(e1.id))?.name, "a");

    await mapper.saveOrUpdate({ id: e1.id, name: "b" });
    assert.equal(rowsById.get(String(e1.id))?.name, "b");
    assert.ok(calls.some((c) => /^UPDATE\b/i.test(c.sql)));
  });

  it("updateNullStrategy IGNORE 跳过 null", async () => {
    rowsById.set("1", { id: "1", name: "keep", remark: "old" });
    const mapper = new BaseMapper({
      table: "demo",
      logicDelete: false,
      fill: false,
      updateNullStrategy: "IGNORE",
    });
    await mapper.updateById({ id: "1", name: "n", remark: null });
    const upd = calls.filter((c) => /^UPDATE\b/i.test(c.sql)).pop();
    assert.ok(upd);
    assert.match(upd!.sql, /`name`/);
    assert.ok(!/`remark`\s*=/.test(upd!.sql));
  });

  it("updateNullStrategy INCLUDE 写入 null", async () => {
    rowsById.set("1", { id: "1", name: "x", remark: "old" });
    const mapper = new BaseMapper({
      table: "demo",
      logicDelete: false,
      fill: false,
      updateNullStrategy: "INCLUDE",
    });
    await mapper.updateById({ id: "1", remark: null });
    const upd = calls.filter((c) => /^UPDATE\b/i.test(c.sql)).pop();
    assert.ok(upd);
    assert.match(upd!.sql, /`remark`/);
    assert.ok(upd!.params.includes(null));
  });
});

describe("P1 多数据源错误与事务", () => {
  it("未注册数据源错误列出已注册名", () => {
    Db.ensureDefault();
    assert.throws(
      () => Db.getDataSource("no_such_ds"),
      /未注册数据源 \[no_such_ds\].*已注册/
    );
  });

  it("register + queryOn 走命名源；Mapper datasource", async () => {
    const calls: string[] = [];
    Db.register("ut_pg", {
      type: "postgresql",
      host: "127.0.0.1",
      database: "ut",
    });
    const ds = Db.getDataSource("ut_pg");
    ds.useDriverForTest({
      async query(sql: string) {
        calls.push(sql);
        return [];
      },
      async getConnection() {
        return {
          async query(sql: string) {
            calls.push(sql);
            return [];
          },
          async begin() {},
          async commit() {},
          async rollback() {},
          release() {},
        };
      },
      async end() {},
    });

    await Db.queryOn("ut_pg", 'SELECT 1 AS "ok"', []);
    assert.ok(calls.some((s) => /SELECT 1/.test(s)));

    const mapper = new BaseMapper({
      table: "t",
      datasource: "ut_pg",
      logicDelete: false,
      fill: false,
    });
    // dialect 应为 pg 引号
    const w = new QueryWrapper(Db.getDialect("ut_pg")).eq("id", 1);
    assert.match(w.build().whereSql, /"id"/);
    void mapper;
  });

  it("嵌套 @Transactional 只 begin/commit 一次", async () => {
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
      @Transactional()
      async inner() {
        assert.equal(Db.inTransaction(), true);
      }

      @Transactional()
      async outer() {
        await this.inner();
      }
    }

    try {
      await new Svc().outer();
      assert.equal(begins, 1);
      assert.equal(commits, 1);
    } finally {
      Db.usePoolForTest(null as unknown as object);
    }
  });
});

describe("P1 IdType 元数据", () => {
  it("@TableId ASSIGN_ID 可读取", () => {
    @TableName("u")
    class U {
      @TableId({ type: IdType.ASSIGN_ID })
      id!: string;
    }
    const id = getEntityIdField(U);
    assert.equal(id?.idType, IdType.ASSIGN_ID);
  });
});
