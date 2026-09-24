import type { NextFunction, Request, Response } from "express";
import ResponseData from "@/framework/utils/entity/ResponseData";
import { Container } from "@/framework/Service";
import SysConfigService from "@/business/service/sysConfig";
import { AESUtil } from "./AESUtil";
import { DynamicAesKeyManager } from "./DynamicAesKeyManager";
import { ENCRYPT_WHITE_LIST, EncryptConstants } from "./constants";

function isWhiteList(path: string): boolean {
  return ENCRYPT_WHITE_LIST.some(
    (item) => path === item || path.endsWith(item)
  );
}

function isMultipart(req: Request): boolean {
  const ct = String(req.headers["content-type"] || "");
  return ct.toLowerCase().startsWith("multipart/form-data");
}

function getSysConfigService(): SysConfigService | null {
  try {
    return Container.get(SysConfigService);
  } catch {
    return null;
  }
}

/**
 * 加密传输中间件：
 * - 解密请求体 encryptData
 * - 加密响应 ResponseData.data
 */
export function encryptMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    void (async () => {
      try {
        const svc = getSysConfigService();
        const enabled = svc ? await svc.isEncryptEnabled() : false;
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
