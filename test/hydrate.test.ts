import "reflect-metadata";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import Db from "@/framework/ORM/Db";
import { Select } from "@/framework/ORM/sqlDecorators";
import { hydrateFieldSelects } from "@/framework/ORM/hydrate";

const originalQuery = Db.query.bind(Db);

afterEach(() => {
  Db.query = originalQuery;
});

describe("字段 @Select 批量填充", () => {
  it("列 = #{父字段} 合并成一条 IN，并按父键分组", async () => {
    class Menu {
      id!: number;

      @Select("SELECT * FROM menu WHERE parent_id = #{id}", { many: true })
      children?: Array<{ parent_id: number; name: string }>;
    }

    const calls: Array<{ sql: string; params: unknown[] }> = [];
    Db.query = (async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      return [
        { parent_id: 1, name: "a" },
        { parent_id: 1, name: "b" },
        { parent_id: 2, name: "c" },
      ];
    }) as typeof Db.query;

    const rows: Array<{
      id: number;
      children?: Array<{ parent_id: number; name: string }>;
    }> = [{ id: 1 }, { id: 2 }, { id: 1 }];
    await hydrateFieldSelects(Menu, rows);

    assert.equal(calls.length, 1);
    assert.match(calls[0].sql, /parent_id IN \(\?, \?\)/i);
    assert.deepEqual(calls[0].params, [1, 2]);
    assert.deepEqual(
      rows[0].children?.map((item) => item.name),
      ["a", "b"]
    );
    assert.deepEqual(
      rows[1].children?.map((item) => item.name),
      ["c"]
    );
    assert.equal(rows[2].children, rows[0].children);
  });

  it("含子查询时仍逐行查询", async () => {
    class Menu {
      id!: number;

      @Select(
        "SELECT name FROM role WHERE id = (SELECT role_id FROM menu_role WHERE menu_id = #{id})",
        { column: "name" }
      )
      roleName?: string;
    }

    const calls: string[] = [];
    Db.query = (async (sql: string) => {
      calls.push(sql);
      return [{ name: "admin" }];
    }) as typeof Db.query;

    const rows: Array<{ id: number; roleName?: string }> = [
      { id: 1 },
      { id: 2 },
    ];
    await hydrateFieldSelects(Menu, rows);

    assert.equal(calls.length, 2);
    assert.equal(rows[0].roleName, "admin");
    assert.equal(rows[1].roleName, "admin");
    assert.ok(calls.every((sql) => !/ IN \(/.test(sql)));
  });
});
