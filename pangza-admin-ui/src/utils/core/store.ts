import storageUtilConfig from "@/config/store.config";
import { getCurrentTime } from "./date";

interface StoreData<T = any> {
    value: T;
    expire?: number;
    [key: string]: any;
}

function getUnitTime() {
    const timeUnit = storageUtilConfig.timeUnit;
    switch (timeUnit) {
        default:
        case "s":
            return 1000;
        case "min":
            return 60 * 1000;
        case "h":
            return 60 * 60 * 1000;
        case "d":
            return 24 * 60 * 60 * 1000;
    }
}

class StorageUtil {

    set(key: string, data: any, expire: number = -1) {
        const state: StoreData = {
            value: data,
        };
        state.expire = expire === -1 ? undefined : getCurrentTime() + expire * getUnitTime();
        localStorage.setItem(storageUtilConfig.prefix + key, JSON.stringify(state));
    }

    get<T>(key: string): Nullable<T> {
        const getKey = storageUtilConfig.prefix + key;
        const data = JSON.parse(localStorage.getItem(getKey)) as StoreData<T>;
        if (!data) return null;
        if (data.expire) {
            if (data.expire < getCurrentTime()) {
                this.remove(key);
                return null;
            }
        }
        return data.value;
    }

    remove(key: string) {
        const removeKey = storageUtilConfig.prefix + key;
        localStorage.removeItem(removeKey);
    }

    clear() {
        localStorage.clear();
    }
}

const storageUtil = new StorageUtil();

export default storageUtil;
