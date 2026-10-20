import "reflect-metadata";
import assert from "node:assert/strict";
import path from "path";
import { afterEach, describe, it } from "node:test";
import Db from "@/framework/ORM/Db";
import { Param } from "@/framework/ORM/sqlDecorators";
import {
  parseMapperXml,
  renderStatementSql,
  evalTest,
  loadXmlMappers,
  resetXmlLoadState,
  getXmlStatement,
  MapperXml,
  xmlMapper,
  executeXmlStatement,
} from "@/framework/ORM/xml";
import { configureOrm } from "@/framework/ORM/config";

const fixtureDir = path.join(__dirname, "fixtures", "mappers");

describe("XML Mapper 解析与动态 SQL", () => {
  it("evalTest 受限表达式", () => {
    assert.equal(evalTest("roleId != null", { roleId: 1 }), true);
    assert.equal(evalTest("roleId != null", {}), false);
    assert.equal(evalTest("ids.length > 0", { ids: [1] }), true);
    assert.equal(evalTest("ids.length > 0", { ids: [] }), false);
    assert.throws(() => evalTest("require('fs')", {}), /非法|不支持/);
  });

  it("解析 include / if / where / foreach", () => {
    const xml = `
      <mapper namespace="ns">
        <sql id="cols">a, b</sql>
        <select id="q">
          SELECT <include refid="cols"/> FROM t
          <where>
            <if test="x != null">AND x = #{x}</if>
          </where>
          AND id IN
          <foreach collection="ids" item="id" open="(" close=")" separator=",">#{id}</foreach>
        </select>
      </mapper>`;
    const parsed = parseMapperXml(xml, "mem.xml");
    assert.equal(parsed.namespace, "ns");
    const stmt = parsed.statements[0]!;
    const sql = renderStatementSql(
      stmt.nodes,
      { x: 9, ids: [1, 2] },
      parsed.sqlFragments
    );
    assert.match(sql, /SELECT a, b FROM t/);
    assert.match(sql, /WHERE x = #\{x\}/);
    assert.match(sql, /IN \(#\{id\},#\{id\}\)|IN \(#\{id\}, #\{id\}\)/);
  });

  it("if 为假时 where 可省略", () => {
    const xml = `
      <mapper namespace="ns2">
        <select id="q">
          SELECT 1 FROM t
          <where><if test="x != null">AND x = #{x}</if></where>
        </select>
      </mapper>`;
    const parsed = parseMapperXml(xml);
    const sql = renderStatementSql(
      parsed.statements[0]!.nodes,
      {},
      parsed.sqlFragments
    );
    assert.ok(!/WHERE/i.test(sql));
  });
});

describe("XML 加载与执行", () => {
  afterEach(() => {
    resetXmlLoadState();
    configureOrm({ mapperLocations: [] });
    Db.usePoolForTest(null as unknown as object);
  });

  it("loadXmlMappers 扫描 fixture", () => {
    const rel = path
      .relative(process.cwd(), fixtureDir)
      .split(path.sep)
      .join("/");
    const result = loadXmlMappers([`${rel}/**/*.xml`]);
    assert.ok(
      result.statements >= 3,
      `期望 >=3 条语句，实际 files=${result.files} statements=${result.statements} loc=${rel}`
    );
    assert.ok(getXmlStatement("com.pangza.DemoMapper", "findByRole"));
  });

  it("xmlMapper + MapperXml 执行 select", async () => {
    loadXmlMappers([
      path.join(fixtureDir, "DemoMapper.xml"),
    ]);

    const calls: Array<{ sql: string; params: unknown[] }> = [];
    Db.usePoolForTest({
      async execute(sql: string, params?: unknown[]) {
        calls.push({ sql, params: params ?? [] });
        return [[{ id: "1", userName: "a" }], []];
      },
      async getConnection() {
        return {
          async execute(sql: string, params?: unknown[]) {
            calls.push({ sql, params: params ?? [] });
            return [[{ id: "1" }], []];
          },
          async beginTransaction() {},
          async commit() {},
          async rollback() {},
          release() {},
        };
      },
      async end() {},
    });

    const rows = await xmlMapper("com.pangza.DemoMapper").selectList(
      "findByRole",
      { roleId: 7 }
    );
    assert.equal(rows.length, 1);
    assert.ok(calls.some((c) => /sys_user/i.test(c.sql)));
    assert.ok(calls.some((c) => c.params.includes(7)));

    @MapperXml("com.pangza.DemoMapper")
    class DemoMapper {
      findByRole(@Param("roleId") _roleId: number): Promise<unknown[]> {
        throw new Error("bound by XML");
      }
    }

    const mapper = new DemoMapper();
    const rows2 = await mapper.findByRole(8);
    assert.ok(Array.isArray(rows2));
    assert.ok(calls.some((c) => c.params.includes(8)));
  });

  it("executeXmlStatement insert 返回 insertId（对齐 @Insert）", async () => {
    loadXmlMappers([path.join(fixtureDir, "DemoMapper.xml")]);
    const original = Db.queryOn.bind(Db);
    Db.queryOn = (async () => ({
      affectedRows: 1,
      insertId: 42,
    })) as typeof Db.queryOn;
    try {
      const n = await executeXmlStatement("com.pangza.DemoMapper", "insertOne", {
        paramObject: { id: "1", userName: "u" },
      });
      assert.equal(n, 42);
    } finally {
      Db.queryOn = original;
    }
  });
});
