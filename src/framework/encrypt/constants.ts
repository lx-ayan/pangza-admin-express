/** 加密传输常量（对齐 Java EncryptConstants / UI） */
export const EncryptConstants = {
  HEADER_SESSION: "X-Encrypt-Session",
  BODY_FIELD: "encryptData",
  REQUEST_ENCRYPT_ATTR: "pangza.encrypt.request",
} as const;

export const ENCRYPT_WHITE_LIST = [
  "/api/aes/key",
  "/api/sys_config/public",
] as const;
