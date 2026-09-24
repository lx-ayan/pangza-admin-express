import crypto from "crypto";

/**
 * AES 加解密（ECB + PKCS7，对齐 Java AESUtil / CryptoJS）
 * key 为 16 字节 UTF-8 字符串（非 Base64）
 */
export const AESUtil = {
  encrypt(plainText: string, key: string): string {
    const keyBuf = Buffer.from(key, "utf8");
    if (keyBuf.length !== 16) {
      throw new Error("AES 密钥长度必须为 16 字节");
    }
    const cipher = crypto.createCipheriv("aes-128-ecb", keyBuf, null);
    cipher.setAutoPadding(true);
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(plainText, "utf8")),
      cipher.final(),
    ]);
    return encrypted.toString("base64");
  },

  decrypt(cipherText: string, key: string): string {
    const keyBuf = Buffer.from(key, "utf8");
    if (keyBuf.length !== 16) {
      throw new Error("AES 密钥长度必须为 16 字节");
    }
    const decipher = crypto.createDecipheriv("aes-128-ecb", keyBuf, null);
    decipher.setAutoPadding(true);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipherText, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  },
};
