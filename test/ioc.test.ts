import "reflect-metadata";
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import {
  Component,
  Container,
  Inject,
  Resource,
} from "@/framework/Service";

describe("IoC 按类注入", () => {
  after(() => {
    Container.clear();
  });

  it("构造器 @Inject(Class) 由容器解析，且为单例", () => {
    @Component()
    class Repo {
      readonly tag = "repo";
    }

    @Component()
    class Svc {
      constructor(@Inject(Repo) readonly repo: Repo) {}
    }

    const a = Container.get(Svc);
    const b = Container.get(Svc);
    assert.equal(a, b);
    assert.ok(a.repo instanceof Repo);
    assert.equal(a.repo.tag, "repo");
    assert.equal(a.repo, Container.get(Repo));
  });

  it("@Resource(Class) 在容器创建时注入同一单例", () => {
    @Component()
    class Store {
      n = 1;
    }

    @Component()
    class Holder {
      @Resource(Store)
      store!: Store;
    }

    const holder = Container.get(Holder);
    assert.equal(holder.store, Container.get(Store));
    holder.store.n = 2;
    assert.equal(Container.get(Store).n, 2);
  });
});
