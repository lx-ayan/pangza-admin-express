import axios from 'axios';
import AESUtil from '@/utils/core/encrypt';
import { EncryptConstants } from '@/utils/data/encrypt';
import { ResponseCode } from '@/utils/data/enums';

const aesUtil = new AESUtil();

let encryptEnabled = false;
let sessionId = '';
let keyExpireAt = 0;
let loadingKeyPromise: Promise<void> | null = null;
let configLoaded = false;

const WHITE_LIST = [
    '/api/aes/key',
    '/api/sys_config/public',
];

/** 明文请求实例：避开加密拦截器，打破循环依赖 */
const plainHttp = axios.create({
    timeout: 10000,
});

function isWhiteList(url?: string) {
    if (!url) {
        return false;
    }
    return WHITE_LIST.some((item) => url.includes(item));
}

async function plainGetData<T>(url: string): Promise<T> {
    const response = await plainHttp.get<ResponseData<T>>(url);
    const payload = response.data;
    if (payload?.code !== ResponseCode.SUCCESS) {
        throw new Error(payload?.message || '请求失败');
    }
    return payload.data as T;
}

/**
 * 拉取公开配置，判断是否开启加密传输
 */
export async function loadEncryptConfig() {
    try {
        const map = await plainGetData<Record<string, string>>('/api/sys_config/public');
        encryptEnabled = map?.[EncryptConstants.CONFIG_ENCRYPT_ENABLED] === 'true';
        configLoaded = true;
        if (!encryptEnabled) {
            sessionId = '';
            keyExpireAt = 0;
            aesUtil.clear();
        }
        return encryptEnabled;
    } catch (error) {
        console.error('加载公开系统配置失败', error);
        encryptEnabled = false;
        configLoaded = true;
        return false;
    }
}

export function isEncryptEnabled() {
    return encryptEnabled;
}

export function isEncryptConfigLoaded() {
    return configLoaded;
}

/**
 * 确保存在未过期的 AES 会话密钥
 */
async function ensureAesSession() {
    if (aesUtil.hasKey() && sessionId && Date.now() < keyExpireAt) {
        return;
    }
    if (loadingKeyPromise) {
        await loadingKeyPromise;
        return;
    }
    loadingKeyPromise = (async () => {
        const result = await plainGetData<{ aesKey: string; sessionId: string }>('/api/aes/key');
        aesUtil.setAesKey(result.aesKey);
        sessionId = result.sessionId;
        // 后端密钥 300s 过期，提前刷新
        keyExpireAt = Date.now() + 4 * 60 * 1000;
    })();
    try {
        await loadingKeyPromise;
    } finally {
        loadingKeyPromise = null;
    }
}

/**
 * 请求前：如开启加密，则加密 JSON body 并附加会话头
 */
export async function applyEncryptRequest(config: IAxiosRequestConfig) {
    if (isWhiteList(config.url)) {
        return config;
    }
    if (!configLoaded) {
        await loadEncryptConfig();
    }
    if (!encryptEnabled) {
        return config;
    }

    await ensureAesSession();
    config.headers = config.headers || {};
    config.headers[EncryptConstants.HEADER_SESSION] = sessionId;

    const method = (config.method || 'get').toLowerCase();
    if (['post', 'put', 'patch'].includes(method) && config.data != null) {
        const contentType = String(config.headers['Content-Type'] || config.headers['content-type'] || '');
        if (contentType.includes('multipart/form-data')) {
            return config;
        }
        // FormData 上传不加密
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
            return config;
        }
        const plainText = typeof config.data === 'string'
            ? config.data
            : JSON.stringify(config.data);
        const cipherText = aesUtil.encrypt(plainText);
        if (!cipherText) {
            throw new Error('请求加密失败');
        }
        config.data = { [EncryptConstants.BODY_FIELD]: cipherText };
        config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    }
    return config;
}

/**
 * 响应后：解密 data 字段
 */
export function applyDecryptResponse(payload: any, requestUrl?: string) {
    if (!encryptEnabled || isWhiteList(requestUrl) || !payload || typeof payload !== 'object') {
        return payload;
    }
    const data = payload.data;
    if (data == null || typeof data !== 'string') {
        return payload;
    }
    if (!aesUtil.hasKey()) {
        return payload;
    }
    const plainText = aesUtil.decrypt(data);
    if (plainText == null || plainText === '') {
        return payload;
    }
    try {
        payload.data = JSON.parse(plainText);
    } catch {
        payload.data = plainText;
    }
    return payload;
}

/**
 * 配置变更后刷新加密开关（例如后台改了 encrypt.enabled）
 */
export async function refreshEncryptConfig() {
    configLoaded = false;
    return loadEncryptConfig();
}
