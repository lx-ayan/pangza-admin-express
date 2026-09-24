export enum ResponseCode {
    SUCCESS = 200,
    ERROR = 500,
    PARAM_ERROR = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    TIMEOUT = 408
}

export enum RequestMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

export enum ContentType {
    JSON = 'application/json;charset=UTF-8',
    FORM_DATA = 'multipart/form-data;charset=UTF-8',
    FORM_URLENCODED = 'application/x-www-form-urlencoded;charset=UTF-8'
}