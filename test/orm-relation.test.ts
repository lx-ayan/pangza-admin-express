import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Db from "@/framework/ORM/Db";
import { BaseMapper } from "@/framework/ORM/BaseMapper";
import {
  TableName,
  TableId,
} from "@/framework/ORM/entityDecorators";
import {
  ManyToOne,
  OneToMany,
  getRelations,
  relationToFieldSelect,
} from "@/framework/ORM/relation";
import { hydrateRelations } from "@/framework/ORM/hydrate";
import { clearTableCache } from "@/framework/ORM/table";
import { configureOrm } from "@/framework/ORM/config";
import { IdType } from "@/framework/ORM/IdType";
import { getDialect } from "@/framework/ORM/dialect";

@TableName("role")
class Role {
  @TableId({ type: IdType.INPUT })
  id!: string;
  name!: string;
}

@TableName("menu")
class Menu {
  @TableId({ type: IdType.INPUT })
  id!: string;
  @OneToMany(() => Menu, { foreignKey: "parent_id", eager: false })
  children?: Menu[];
}

@TableName("sys_user")
class User {
  @TableId({ type: IdType.INPUT })
  id!: string;
  role_id!: string;
  @ManyToOne(() => Role, { foreignKey: "role_id", eager: true })
  role?: Role;
  @OneToMany(() => Menu, { foreignKey: "parent_id", localKey: "id", eager: false })
  menus?: Menu[];
}

describe("声明式关联 R1", () => {
  it("元数据与 SQL 编译", () => {
    const rels = getRelations(User);
    assert.equal(rels.length, 2);
    const m2o = rels.find((r) => r.property === "role");
    assert.ok(m2o);
    assert.equal(m2o!.kind, "ManyToOne");
    assert.equal(m2o!.eager, true);

    const sql = relationToFieldSelect(User, m2o!, getDialect("mysql")).sql;
    assert.match(sql, /FROM `role`/);
    assert.match(sql, /`id` = #\{role_id\}/);
  });

  it("selectList 自动填 eager；relations 可覆盖", async () => {
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    clearTableCache();
    configureOrm({
      logicDelete: false,
      fillCreateTime: undefined,
      fillUpdateTime: undefined,
      fillCreateBy: undefined,
      fillUpdateBy: undefined,
      sqlLog: false,
    });
    const originalQueryOn = Db.queryOn.bind(Db);
    const originalTxOn = Db.transactionOn.bind(Db);
    Db.ensureDefault();

    Db.queryOn = (async (_n: string, sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      const compact = sql.replace(/\s+/g, " ").trim();
      if (/^SHOW COLUMNS/i.test(compact)) {
        return [
          { Field: "id" },
          { Field: "role_id" },
          { Field: "parent_id" },
          { Field: "name" },
        ];
      }
      if (/FROM `sys_user`/i.test(compact)) {
        return [{ id: "u1", role_id: "r1" }];
      }
      if (/FROM `role`/i.test(compact)) {
        return [{ id: "r1", name: "admin" }];
      }
      if (/FROM `menu`/i.test(compact)) {
        return [{ id: "m1", parent_id: "u1" }];
      }
      return [];
    }) as typeof Db.queryOn;
    Db.transactionOn = (async (_n, fn) => fn()) as typeof Db.transactionOn;

    try {
      const mapper = new BaseMapper<User>({
        table: "sys_user",
        entity: User,
        logicDelete: false,
        fill: false,
      });

      const rows = await mapper.selectList();
      assert.equal(rows.length, 1);
      assert.equal((rows[0] as any).role?.name, "admin");
      assert.equal((rows[0] as any).menus, undefined);

      calls.length = 0;
      const withMenus = await mapper.selectList(undefined, {
        relations: ["menus"],
      });
      assert.ok(Array.isArray((withMenus[0] as any).menus));
      assert.ok(calls.some((c) => /FROM `menu`/i.test(c.sql)));

      calls.length = 0;
      await mapper.selectList(undefined, { relations: false });
      assert.ok(!calls.some((c) => /FROM `role`/i.test(c.sql)));
    } finally {
      Db.queryOn = originalQueryOn;
      Db.transactionOn = originalTxOn;
      clearTableCache();
    }
  });

  it("hydrateRelations 手动填充", async () => {
    const originalQueryOn = Db.queryOn.bind(Db);
    Db.ensureDefault();
    Db.queryOn = (async (_n, sql) => {
      if (/FROM `menu`/i.test(sql)) {
        return [{ id: "c1", parent_id: "p1" }];
      }
      return [];
    }) as typeof Db.queryOn;

    try {
      const rows = [{ id: "p1" }];
      await hydrateRelations(Menu, rows, { relations: ["children"] });
      assert.equal((rows[0] as any).children?.[0]?.id, "c1");
    } finally {
      Db.queryOn = originalQueryOn;
    }
  });
});
