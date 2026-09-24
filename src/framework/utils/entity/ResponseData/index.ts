import { ResponseCode } from "@/framework/types/enums";

class ResponseData<T> {
    code: ResponseCode = ResponseCode.SUCCESS;
    message: string = '操作成功';
    data: T | null = null;

    private constructor(){

    }

    static success<T = any>(data: T, message: string = '操作成功'): ResponseData<T> {
        const response = new ResponseData<T>();
        response.data = data;
        response.message = message;
        return response;
    }

    static error<T = any>(
        message: string = '操作失败',
        data: T | null = null,
        code: ResponseCode = ResponseCode.ERROR
    ): ResponseData<T> {
        const response = new ResponseData<T>();
        response.code = code;
        response.message = message;
        response.data = data;
        return response;
    }
}

export default ResponseData;