import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import { Container, Component } from "@/framework/Service";
import {
  isApplicationDestroy,
  isApplicationInit,
  resetLifecycleForTest,
  runApplicationDestroys,
  runApplicationInits,
} from "@/framework/Application/lifecycle";
import type {
  ApplicationDestroy,
  ApplicationInit,
} from "@/framework/Application/types";

describe("ApplicationInit / ApplicationDestroy", () => {
  afterEach(() => {
    resetLifecycleForTest();
    Container.clear();
  });

  it("duck-type 识别接口", () => {
    assert.equal(isApplicationInit({ init() {} }), true);
    assert.equal(isApplicationInit({}), false);
    assert.equal(isApplicationDestroy({ destroy() {} }), true);
    assert.equal(isApplicationDestroy({ init() {} }), false);
  });

  it("启动后调用 init，退出前逆序 destroy", async () => {
    const order: string[] = [];

    @Component()
    class A implements ApplicationInit, ApplicationDestroy {
      init() {
        order.push("a-init");
      }
      destroy() {
        order.push("a-destroy");
      }
    }

    @Component()
    class B implements ApplicationInit, ApplicationDestroy {
      async init() {
        order.push("b-init");
      }
      async destroy() {
        order.push("b-destroy");
      }
    }

    void A;
    void B;

    await runApplicationInits();
    assert.deepEqual(order, ["a-init", "b-init"]);

    await runApplicationDestroys();
    assert.deepEqual(order, ["a-init", "b-init", "b-destroy", "a-destroy"]);
  });

  it("init 只执行一次", async () => {
    let n = 0;

    @Component()
    class Once implements ApplicationInit {
      init() {
        n += 1;
      }
    }
    void Once;

    await runApplicationInits();
    await runApplicationInits();
    assert.equal(n, 1);
  });
});
