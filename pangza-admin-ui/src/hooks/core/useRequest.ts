import request from "@/plugins/axios"
import type { AxiosRequestConfig } from "axios"
import { useDebounce, type DebounceOption } from "./useDebounce";
import { RequestMethod } from "@/utils/data/enums";
import ObjectUtil from "@/utils/clz/ObjectUtil";

interface RequestDebounceOption extends DebounceOption {
    wait?: number;
}

interface RequestOption {
    requestOption?: AxiosRequestConfig;
    debounceOption?: RequestDebounceOption;
}

const requestProxy = <T>(url: string, method: RequestMethod, data: any, option: RequestOption): Promise<T> => {

    // this 丢失
    const _request = request[method.toLocaleLowerCase()].bind(request);

    if (ObjectUtil.isNotEmpty(option.debounceOption)) {
        const { wait = 200 } = option.debounceOption;
        const [handleRequest] = useDebounce(_request, wait, { immediate: true, ...option.debounceOption })
        return handleRequest(url, data, option.requestOption) as Promise<T>;
    }

    return _request<T>(url, data) as Promise<T>;
}

function useRequest(prefix: string = '', debounceOption: RequestDebounceOption = {}) {

    const requestManager = {
        get: <T = any>(url: string, data?: any, option?: RequestOption) => {
            return requestProxy<T>(`${prefix}${url}`, RequestMethod.GET, data, { debounceOption, ...option });
        },
        post: <T = any>(url: string, data?: any, option?: RequestOption) => {
            return requestProxy<T>(`${prefix}${url}`, RequestMethod.POST, data, { debounceOption, ...option });
        },
        delete: <T = any>(url: string, data?: any, option?: RequestOption) => {
            return requestProxy<T>(`${prefix}${url}`, RequestMethod.DELETE, data, { debounceOption, ...option });
        },
        put: <T = any>(url: string, data?: any, option?: RequestOption) => {
            return requestProxy<T>(`${prefix}${url}`, RequestMethod.PUT, data, { debounceOption, ...option });
        },
        getUrl: (url: string = '') => {
            return `${prefix}${url}`;
        }
    } as const;

    return requestManager;
}

export default useRequest;