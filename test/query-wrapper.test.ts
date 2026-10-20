import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QueryWrapper } from "@/framework/ORM/QueryWrapper";
import { assertIdent, assertSafeLastSql, escapeLike } from "@/framework/ORM/security";
import { parseMybatisSql } from "@/framework/ORM/sqlTemplate";
import { getDialect } from "@/framework/ORM/dialect";

describe("QueryWrapper 条件", () => {
  it("notIn / notLike / notBetween 生成正确片段", () => {
    const frag = new QueryWrapper()
      .notIn("status", [1, 2])
      .notLike("name", "a%b")
      .notBetween("age", 10, 20)
      .build();
    assert.match(frag.whereSql, /`status` NOT IN \(\?, \?\)/);
    assert.match(frag.whereSql, /`name` NOT LIKE \? ESCAPE/);
    assert.match(frag.whereSql, /`age` NOT BETWEEN \? AND \?/);
    assert.deepEqual(frag.params.slice(0, 2), [1, 2]);
    assert.equal(frag.params[2], `%${escapeLike("a%b")}%`);
    assert.deepEqual(frag.params.slice(3), [10, 20]);
  });

  it("in([]) 永假，notIn([]) 永真", () => {
    assert.match(new QueryWrapper().in("id", []).build().whereSql, /1 = 0/);
    assert.match(new QueryWrapper().notIn("id", []).build().whereSql, /1 = 1/);
  });

  it("nested 沿用父级方言引号（postgresql）", () => {
    const frag = new QueryWrapper({ dialect: "postgresql" })
      .eq("a", 1)
      .nested((w) => {
        w.eq("b", 2).or().eq("c", 3);
      })
      .build();
    assert.match(frag.whereSql, /"a" = \?/);
    assert.match(frag.whereSql, /\("b" = \? OR "c" = \?\)/);
    assert.ok(!frag.whereSql.includes("`"));
  });

  it("非法列名被 assertIdent 拒绝", () => {
    assert.throws(() => new QueryWrapper().eq("id;drop", 1), /非法标识符/);
  });
});

describe("security 标识符与 last", () => {
  it("assertIdent 拒绝注入形标识符", () => {
    assert.equal(assertIdent("user_name"), "user_name");
    assert.throws(() => assertIdent("a b"), /非法标识符/);
    assert.throws(() => assertIdent("1abc"), /非法标识符/);
    assert.throws(() => assertIdent("__proto__"), /非法标识符/);
  });

  it("assertSafeLastSql 仅允许白名单", () => {
    assert.equal(assertSafeLastSql("LIMIT 10"), "LIMIT 10");
    assert.throws(() => assertSafeLastSql("; DROP TABLE t"), /仅允许/);
  });
});

describe("SQL 模板 #{} / ${}", () => {
  it("#{id} 参数绑定", () => {
    const parsed = parseMybatisSql("SELECT * FROM t WHERE id = #{id}", {
      id: 7,
    });
    assert.equal(parsed.sql, "SELECT * FROM t WHERE id = ?");
    assert.deepEqual(parsed.params, [7]);
  });

  it("${} 危险值拒绝", () => {
    assert.throws(
      () =>
        parseMybatisSql("SELECT * FROM ${table}", {
          table: "t; DROP TABLE u",
        }),
      /危险字符/
    );
  });

  it("${} 可信标识符可通过", () => {
    const parsed = parseMybatisSql(
      "SELECT * FROM ${table}",
      { table: "sys_user" },
      { silenceDollarWarn: true }
    );
    assert.equal(parsed.sql, "SELECT * FROM sys_user");
  });
});

describe("方言引号", () => {
  it("mysql / postgresql / sqlserver 引号不同", () => {
    assert.equal(getDialect("mysql").quoteIdent("id"), "`id`");
    assert.equal(getDialect("postgresql").quoteIdent("id"), `"id"`);
    assert.equal(getDialect("sqlserver").quoteIdent("id"), "[id]");
  });
});
