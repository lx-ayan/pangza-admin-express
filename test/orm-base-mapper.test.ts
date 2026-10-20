import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import Db from "@/framework/ORM/Db";
import { BaseMapper } from "@/framework/ORM/BaseMapper";
import { QueryWrapper } from "@/framework/ORM/QueryWrapper";
import { clearTableCache } from "@/framework/ORM/table";
import { configureOrm } from "@/framework/ORM/config";

type QueryCall = { sql: string; params: unknown[] };

describe("BaseMapper CRUD（mock 驱动）", () => {
  let calls: QueryCall[] = [];
  let originalQueryOn: typeof Db.queryOn;
  let originalTxOn: typeof Db.transactionOn;

  beforeEach(() => {
    clearTableCache();
    configureOrm({
      logicDelete: true,
      fillCreateTime: undefined,
      fillUpdateTime: undefined,
      fillCreateBy: undefined,
      fillUpdateBy: undefined,
      sqlLog: false,
    });
    calls = [];
    originalQueryOn = Db.queryOn.bind(Db);
    originalTxOn = Db.transactionOn.bind(Db);

    // 确保 default 数据源已注册（不真实连库）
    Db.ensureDefault();

    Db.queryOn = (async (_name: string, sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      const compact = sql.replace(/\s+/g, " ").trim();
      if (/^SHOW COLUMNS/i.test(compact) || /information_schema/i.test(compact)) {
        return [
          { Field: "id" },
          { Field: "name" },
          { Field: "delete_flag" },
          { Field: "version" },
        ];
      }
      if (/^SELECT COUNT/i.test(compact)) {
        return [{ cnt: 2 }];
      }
      if (/^SELECT\b/i.test(compact)) {
        return [{ id: "1", name: "a", delete_flag: 0 }];
      }
      if (/^INSERT\b/i.test(compact)) {
        return { insertId: 0, affectedRows: 1 };
      }
      if (/^UPDATE\b/i.test(compact)) {
        return { affectedRows: 1 };
      }
      if (/^DELETE\b/i.test(compact)) {
        return { affectedRows: 1 };
      }
      return { affectedRows: 0 };
    }) as typeof Db.queryOn;

    Db.transactionOn = (async (_name: string, fn: () => Promise<unknown>) =>
      fn()) as typeof Db.transactionOn;
  });

  afterEach(() => {
    Db.queryOn = originalQueryOn;
    Db.transactionOn = originalTxOn;
    clearTableCache();
  });

  it("selectList 自动附加未删除条件", async () => {
    const mapper = new BaseMapper({
      table: "demo",
      logicDelete: true,
      fill: false,
    });
    await mapper.selectList(new QueryWrapper().eq("name", "a"));
    const select = calls.find((c) => /^SELECT\b/i.test(c.sql));
    assert.ok(select);
    assert.match(select!.sql, /delete_flag/);
    assert.ok(select!.params.includes(0));
    assert.ok(select!.params.includes("a"));
  });

  it("deleteById 逻辑删除走 UPDATE", async () => {
    const mapper = new BaseMapper({
      table: "demo",
      logicDelete: true,
      fill: false,
    });
    await mapper.deleteById("1");
    const upd = calls.find((c) => /^UPDATE\b/i.test(c.sql));
    assert.ok(upd);
    assert.match(upd!.sql, /UPDATE/);
    assert.match(upd!.sql, /delete_flag/);
    assert.ok(!calls.some((c) => /^DELETE\b/i.test(c.sql)));
  });

  it("physicalDeleteById 始终 DELETE", async () => {
    const mapper = new BaseMapper({
      table: "demo",
      logicDelete: true,
      fill: false,
    });
    await mapper.physicalDeleteById("1");
    const del = calls.find((c) => /^DELETE\b/i.test(c.sql));
    assert.ok(del);
    assert.match(del!.sql, /DELETE FROM/);
    assert.ok(!calls.some((c) => /^UPDATE\b/i.test(c.sql)));
  });

  it("physicalDelete 无 WHERE 抛错", async () => {
    const mapper = new BaseMapper({
      table: "demo",
      logicDelete: false,
      fill: false,
    });
    await assert.rejects(
      () => mapper.physicalDelete(new QueryWrapper()),
      /必须带 WHERE/
    );
  });

  it("selectPage 返回 records / total / current / size", async () => {
    const mapper = new BaseMapper({
      table: "demo",
      logicDelete: false,
      fill: false,
    });
    const page = await mapper.selectPage(
      { current: 1, size: 10 },
      new QueryWrapper()
    );
    assert.equal(page.current, 1);
    assert.equal(page.size, 10);
    assert.equal(page.total, 2);
    assert.ok(Array.isArray(page.records));
  });

  it("logicDelete: false 时 delete 走物理 DELETE", async () => {
    const mapper = new BaseMapper({
      table: "demo",
      logicDelete: false,
      fill: false,
    });
    await mapper.delete(new QueryWrapper().eq("id", "1"));
    assert.ok(calls.some((c) => /^DELETE\b/i.test(c.sql)));
  });
});
