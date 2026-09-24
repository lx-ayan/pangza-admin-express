import "reflect-metadata";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { describe, it } from "node:test";
import {
  PostMapping,
  RequestBody,
} from "@/framework/Application/decorators";
import {
  getControllerRoutes,
  joinRoutePath,
} from "@/framework/Application/metadata";
import {
  resolveCallbackArgs,
  resolveRawCallbackArgs,
} from "@/framework/Application/callbackArgs";

describe("路由注册与参数注入", () => {
  it("@PostMapping + @RequestBody 写入路由，并按 body 注入", () => {
    class EchoController {
      @PostMapping("/echo")
      echo(@RequestBody() _body: { name: string }) {
        return _body;
      }
    }

    const [route] = getControllerRoutes(EchoController);
    assert.ok(route);
    assert.equal(route.method, "POST");
    assert.equal(joinRoutePath("/api/user", route.path), "/api/user/echo");

    const args = resolveCallbackArgs(
      { body: { name: "admin" } } as Request,
      route.option,
      1
    );
    assert.deepEqual(args[0], { name: "admin" });
  });

  it("Flux 未标注的形参收到 res，已标注的仍是 body", () => {
    const res = { writable: true } as Response;
    const args = resolveRawCallbackArgs(
      { body: { step: 1 } } as Request,
      res,
      { flux: true, params: [{ index: 0, source: "body" }] },
      2
    );
    assert.deepEqual(args[0], { step: 1 });
    assert.equal(args[1], res);
  });
});
