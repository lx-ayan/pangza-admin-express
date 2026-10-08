/**
 * 传输加密中间件（业务示例）。
 * 开关读 sys_config；framework 只提供 AESUtil / DynamicAesKeyManager。
 */
import type { NextFunction, Request, Response } from "express";
import Application from "@/framework/Application";
import ResponseData from "@/framework/utils/entity/ResponseData";
import { AESUtil } from "@/framework/encrypt/AESUtil";
import { DynamicAesKeyManager } from "@/framework/encrypt/DynamicAesKeyManager";
import { Container } from "@/framework/Service";
import SysConfigService from "@/business/service/sysConfig";

const EncryptConstants = {
  HEADER_SESSION: "X-Encrypt-Session",
  BODY_FIELD: "encryptData",
  REQUEST_ENCRYPT_ATTR: "pangza.encrypt.request",
} as const;

const ENCRYPT_WHITE_LIST = ["/api/aes/key", "/api/sys_config/public"] as const;

function isWhiteList(path: string): boolean {
  return ENCRYPT_WHITE_LIST.some(
    (item) => path === item || path.endsWith(item)
  );
}

function isMultipart(req: Request): boolean {
  const ct = String(req.headers["content-type"] || "");
  return ct.toLowerCase().startsWith("multipart/form-data");
}

export function encryptTransportMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    void (async () => {
      try {
        let enabled = false;
        try {
          enabled = await Container.get(SysConfigService).isEncryptEnabled();
        } catch {
          enabled = false;
        }
        if (!enabled || isWhiteList(req.path) || isMultipart(req)) {
          return next();
        }

        (req as any)[EncryptConstants.REQUEST_ENCRYPT_ATTR] = true;

        const method = req.method.toUpperCase();
        const isJson = String(req.headers["content-type"] || "")
          .toLowerCase()
          .includes("application/json");

        if (
          isJson &&
          method !== "GET" &&
          method !== "DELETE" &&
          method !== "HEAD"
        ) {
          const sessionId = String(
            req.headers[EncryptConstants.HEADER_SESSION.toLowerCase()] || ""
          );
          if (!sessionId) {
            res
              .status(200)
              .send(
                ResponseData.error(
                  `缺少加密会话头 ${EncryptConstants.HEADER_SESSION}`
                )
              );
            return;
          }
          const body = req.body as Record<string, unknown> | undefined;
          const encryptData = body?.[EncryptConstants.BODY_FIELD];
          if (typeof encryptData !== "string" || !encryptData.trim()) {
            res
              .status(200)
              .send(
                ResponseData.error(
                  `开启加密传输后，请求体必须包含 ${EncryptConstants.BODY_FIELD}`
                )
              );
            return;
          }
          try {
            const aesKey =
              DynamicAesKeyManager.getAesKeyBySessionId(sessionId);
            const plain = AESUtil.decrypt(encryptData, aesKey);
            req.body = JSON.parse(plain);
          } catch (e) {
            res
              .status(200)
              .send(
                ResponseData.error(
                  `请求解密失败：${e instanceof Error ? e.message : e}`
                )
              );
            return;
          }
        }

        const originalSend = res.send.bind(res);
        res.send = ((body?: any) => {
          try {
            if (
              body &&
              typeof body === "object" &&
              "data" in body &&
              body.data != null
            ) {
              const sessionId = String(
                req.headers[EncryptConstants.HEADER_SESSION.toLowerCase()] ||
                  ""
              );
              if (!sessionId) {
                return originalSend(
                  ResponseData.error(
                    `开启加密传输后，响应加密需要请求头 ${EncryptConstants.HEADER_SESSION}`
                  )
                );
              }
              const aesKey =
                DynamicAesKeyManager.getAesKeyBySessionId(sessionId);
              const plain =
                typeof body.data === "string"
                  ? body.data
                  : JSON.stringify(body.data);
              const cipher = AESUtil.encrypt(plain, aesKey);
              return originalSend({
                ...body,
                data: cipher,
              });
            }
          } catch (e) {
            return originalSend(
              ResponseData.error(
                `响应加密失败：${e instanceof Error ? e.message : e}`
              )
            );
          }
          return originalSend(body);
        }) as typeof res.send;

        next();
      } catch (e) {
        next(e);
      }
    })();
  };
}

// 模块加载时挂到 Application（示例能力，随本文件删除即失效）
Application.getApp().use(encryptTransportMiddleware());
