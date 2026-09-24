import { hideFullLoading, showFullLoading } from "@/components/Loading";
import AXIOS_CONFIG from "@/config/axios.config";
import { RequestMethod, ResponseCode } from "@/utils/data/enums";
import ObjectUtil from "@/utils/clz/ObjectUtil";
import type {
  AxiosInstance,
  AxiosRequestConfig,
  CreateAxiosDefaults,
} from "axios";
import axios from "axios";
import AxiosCanceler from "./AxiosCanceler";
import useUserStore from "@/store/userStore";
import { ERROR_MESSAGE } from "@/utils/data/constant";
import { MessagePlugin } from "tdesign-vue-next";
import router from "@/router";
import { applyDecryptResponse, applyEncryptRequest } from "@/utils/core/encryptTransport";

const axiosCanceler = new AxiosCanceler();

function defaultErrorHandler(message?: string) {
  MessagePlugin.error(message);
}

function notLoginErrorHandler(message?: string) {
  const userStore = useUserStore();
  // token 已失效时只清本地态，避免再次请求 /logout 触发循环
  userStore.clearLoginState();
  defaultErrorHandler(message);
  router.push('/login');
}

function notPermissionHandler(message?: string) {
  defaultErrorHandler(message);
  router.push({ name: 'notpermission' })
}

const ERROR_MAP = {
  [ResponseCode.ERROR]: {
    message: ERROR_MESSAGE.SERVER_ERROR,
    method: defaultErrorHandler
  },
  [ResponseCode.PARAM_ERROR]: {
    message: ERROR_MESSAGE.PARAMS_ERROR,
    method: defaultErrorHandler
  },
  [ResponseCode.FORBIDDEN]: {
    message: ERROR_MESSAGE.FORBEDDEN_ERROR,
    method: notPermissionHandler
  },
  [ResponseCode.UNAUTHORIZED]: {
    message: ERROR_MESSAGE.UNAUTHORIZED_ERROR,
    method: notLoginErrorHandler
  },
  [ResponseCode.TIMEOUT]: {
    message: ERROR_MESSAGE.TIMEOUT_ERROR,
    method: defaultErrorHandler
  },
  [ResponseCode.NOT_FOUND]: {
    message: ERROR_MESSAGE.NOT_FOUND_ERROR,
    method: defaultErrorHandler
  },
}


class VAxios {
  private instance: Nullable<AxiosInstance> = null;

  private constructor(config: CreateAxiosDefaults) {
    this.createAxios(config);
  }

  private createAxios(config: CreateAxiosDefaults) {
    if (ObjectUtil.isEmpty(this.instance)) {
      this.instance = axios.create(config);
      this.setInterceptors();
    }
  }

  private setInterceptors() {
    this.instance?.interceptors.request.use(
      AXIOS_CONFIG.requestInterceptor
        ? (AXIOS_CONFIG.requestInterceptor as any)
        : async (config: IAxiosRequestConfig) => {
          if (config.loading) {
            showFullLoading(config.loadingText);
          }
          if (config.cancel) {
            axiosCanceler.addPending(config as AxiosRequestConfig);
          }

          const userStore = useUserStore();
          if (userStore.token) {
            config['headers']['Authorization'] = userStore.token;
          }
          return applyEncryptRequest(config);
        },
      () => {
        hideFullLoading();
      }
    );

    this.instance!.interceptors.response.use((response) => {
      return new Promise((resolve, reject) => {
        axiosCanceler.removePending(response.config);
        if (response.headers["content-type"]?.toString().includes('application/vnd.ms-excel;')) {
          //@ts-ignore
          resolve(response.data);
          return;
        }
        if (response.status !== 200) {
          const event = ERROR_MAP[response.status];
          if (event) {
            event.method(response.data.message || event?.message || ERROR_MESSAGE.NETWORK_ERROR);
          }
          return reject(event?.message || ERROR_MESSAGE.NETWORK_ERROR);
        } else {
          const payload = applyDecryptResponse(response.data, response.config.url);
          if (payload.code !== ResponseCode.SUCCESS) {
            const event = ERROR_MAP[payload.code];
            if (event) {
              event.method(payload.message || event?.message || ERROR_MESSAGE.NETWORK_ERROR);
              return reject(payload.message || event?.message || ERROR_MESSAGE.NETWORK_ERROR);
            }
          }
          resolve(payload.data);
        }
      });
    }
    );
  }

  public static createVAxios(config: CreateAxiosDefaults) {
    const vAxios = new VAxios(config);
    return vAxios;
  }

  public request<T, D = ResponseData<T>>(config: AxiosRequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      this.instance!.request<D>(config).then(res => {
        resolve(res as T);
      }).catch(err => {
        reject(err);
      })
    })
  }

  public post<T>(url: string, data: any, options: AxiosRequestConfig = {}) {
    return this.request<T>({
      ...options,
      url,
      data,
      method: RequestMethod.POST,
    });
  }

  public get<T>(url: string, data: any, options: AxiosRequestConfig = {}) {
    return this.request<T>({
      ...options,
      url,
      params: data,
      method: RequestMethod.GET,
    });
  }

  public put<T>(url: string, data: any, options: AxiosRequestConfig = {}) {
    return this.request<T>({
      ...options,
      url,
      data,
      method: RequestMethod.PUT,
    });
  }

  public delete<T>(url: string, data: any, options: AxiosRequestConfig = {}) {
    return this.request<T>({
      ...options,
      url,
      params: data,
      method: RequestMethod.DELETE,
    });
  }
}

export default VAxios;
