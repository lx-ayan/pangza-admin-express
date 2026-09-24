import CryptoJS from 'crypto-js';

/**
 * AES 加解密（ECB + PKCS7，与后端 AESUtil 一致）
 * 密钥：后端下发 Base64(UTF-8 的 16 位密钥字符串)
 */
class AESUtil {
    private keyWords: CryptoJS.lib.WordArray | null = null;

    /** 设置 Base64 编码的 AES 密钥 */
    setAesKey(base64Key: string) {
        this.keyWords = CryptoJS.enc.Base64.parse(base64Key);
    }

    clear() {
        this.keyWords = null;
    }

    hasKey() {
        return this.keyWords != null;
    }

    encrypt(data: string) {
        if (!this.keyWords) {
            console.error('AES 密钥未设置');
            return null;
        }
        try {
            return CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(data), this.keyWords, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7,
            }).toString();
        } catch (error) {
            console.error('AES 加密失败：', error);
            return null;
        }
    }

    decrypt(cipherText: string) {
        if (!this.keyWords) {
            console.error('AES 密钥未设置');
            return null;
        }
        try {
            const decrypted = CryptoJS.AES.decrypt(cipherText, this.keyWords, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7,
            });
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('AES 解密失败：', error);
            return null;
        }
    }
}

export default AESUtil;
