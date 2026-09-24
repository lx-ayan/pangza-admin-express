/** 与后端 EncryptConstants 对齐 */
export const EncryptConstants = {
    HEADER_SESSION: 'X-Encrypt-Session',
    BODY_FIELD: 'encryptData',
    CONFIG_ENCRYPT_ENABLED: 'security.encrypt.enabled',
} as const;
