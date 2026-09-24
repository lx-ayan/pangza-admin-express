import crypto from "crypto";

const KEY_EXPIRE_MS = 300_000;
const AES_KEY_LENGTH = 16;

const keyMap = new Map<string, { key: string; timer: NodeJS.Timeout }>();

/**
 * 动态 AES 会话密钥（对齐 Java DynamicAesKeyManager）
 */
export const DynamicAesKeyManager = {
  generateDynamicKey(): { sessionId: string; aesKey: string } {
    const aesKey = crypto.randomUUID().replace(/-/g, "").slice(0, AES_KEY_LENGTH);
    if (aesKey.length !== AES_KEY_LENGTH) {
      throw new Error(`生成的AES密钥长度不符合要求：${aesKey.length}`);
    }
    const sessionId = crypto.randomUUID();
    const timer = setTimeout(() => {
      keyMap.delete(sessionId);
    }, KEY_EXPIRE_MS);
    timer.unref?.();
    keyMap.set(sessionId, { key: aesKey, timer });

    return {
      sessionId,
      aesKey: Buffer.from(aesKey, "utf8").toString("base64"),
    };
  },

  getAesKeyBySessionId(sessionId: string): string {
    const entry = keyMap.get(sessionId);
    if (!entry) {
      throw new Error("密钥已过期或不存在");
    }
    if (entry.key.length !== AES_KEY_LENGTH) {
      throw new Error("存储的AES密钥长度异常");
    }
    return entry.key;
  },

  removeKey(sessionId: string): void {
    const entry = keyMap.get(sessionId);
    if (entry) {
      clearTimeout(entry.timer);
      keyMap.delete(sessionId);
    }
  },
};
