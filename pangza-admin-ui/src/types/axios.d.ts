interface AxiosConfig {
    requestInterceptor?: (config: IAxiosRequestConfig) => IAxiosRequestConfig
    responseInterceptor?: (response: any) => any;
    errorHandler?: () => void;
}

interface IAxiosRequestConfig extends AxiosRequestConfig {
    loading?: boolean;
    loadingText?: string;
    cancel?: boolean;
}
