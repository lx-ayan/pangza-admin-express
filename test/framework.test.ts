import "reflect-metadata";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NotNull, validateHandler, ValidationError } from "@/framework/Validate";
import {
  getEntityTableMeta,
  TableId,
  TableName,
} from "@/framework/ORM/entityDecorators";
import Db from "@/framework/ORM/Db";
import { Transactional } from "@/framework/ORM/transactional";

describe("校验与实体表名", () => {
  it("validateHandler 按 @NotNull 拒绝空值", async () => {
    class CreateUserDto {
      @NotNull("用户名不能为空")
      username!: string;
    }

    await assert.rejects(
      () => validateHandler({}, CreateUserDto),
      (err: unknown) => {
        assert.ok(err instanceof ValidationError);
        assert.match(err.message, /用户名不能为空/);
        return true;
      }
    );
    await validateHandler({ username: "admin" }, CreateUserDto);
  });

  it("@TableName / @TableId 能被读成表元数据", () => {
    @TableName("sys_user")
    class User {
      @TableId("user_id")
      id!: string;
    }

    const meta = getEntityTableMeta(User);
    assert.ok(meta);
    assert.equal(meta.tableName, "sys_user");
    assert.equal(meta.idColumn, "user_id");
  });
});

describe("事务回滚", () => {
  it("失败时 rollback 且不 commit，连接会释放", async () => {
    const conn = {
      committed: false,
      rolled: false,
      released: false,
      beginTransaction: async () => undefined,
      commit: async () => {
        conn.committed = true;
      },
      rollback: async () => {
        conn.rolled = true;
      },
      release: () => {
        conn.released = true;
      },
    };
    const db = Db as unknown as {
      ensureReady: () => Promise<{ getConnection: () => Promise<typeof conn> }>;
    };
    const original = db.ensureReady;
    db.ensureReady = async () => ({
      getConnection: async () => conn,
    });

    try {
      await assert.rejects(
        () =>
          Db.transaction(async () => {
            throw new Error("boom");
          }),
        /boom/
      );
      assert.equal(conn.rolled, true);
      assert.equal(conn.committed, false);
      assert.equal(conn.released, true);
    } finally {
      db.ensureReady = original;
    }
  });

  it("嵌套事务加入外层，只提交一次", async () => {
    let begins = 0;
    let commits = 0;
    const conn = {
      beginTransaction: async () => {
        begins += 1;
      },
      commit: async () => {
        commits += 1;
      },
      rollback: async () => undefined,
      release: () => undefined,
    };
    const db = Db as unknown as {
      ensureReady: () => Promise<{ getConnection: () => Promise<typeof conn> }>;
    };
    const original = db.ensureReady;
    db.ensureReady = async () => ({
      getConnection: async () => conn,
    });

    class Account {
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
      await new Account().outer();
      assert.equal(begins, 1);
      assert.equal(commits, 1);
    } finally {
      db.ensureReady = original;
    }
  });
});
