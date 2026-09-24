import type { AxiosRequestConfig, Canceler } from "axios";
import axios from "axios";

let cancelMap: Map<string, Canceler> = new Map<string, Canceler>();

const getPeddingConfig = (config: AxiosRequestConfig) => [config.method, config.url].join('&');

class AxiosCanceler {
    addPending(config: AxiosRequestConfig) {
        this.removePending(config);
        const key = getPeddingConfig(config);
        config.cancelToken = config.cancelToken || new axios.CancelToken((cancel) => {
            if (!cancelMap.has(key)) {
                cancelMap.set(key, cancel);
            }
        })
    }

    removePending(config: AxiosRequestConfig) {
        const key = getPeddingConfig(config);
        const canceler = cancelMap.get(key);
        canceler && canceler(key);
        cancelMap.delete(key);
    }

    removeAllPending() {
        cancelMap.forEach(cancel => {
            cancel && cancel();
        })
        cancelMap.clear();
    }

    reset() {
        cancelMap = new Map<string, Canceler>();
    }
}

export default AxiosCanceler;