export const ERROR_MESSAGE = {
    NETWORK_ERROR: '网络异常，请稍后重试',
    TIMEOUT_ERROR: '请求超时，请稍后重试',
    SERVER_ERROR: '服务器异常，请稍后重试',
    UNAUTHORIZED_ERROR: '登录失效，请重新登录',
    PARAMS_ERROR: '参数错误，请检查后重试',
    FORBEDDEN_ERROR: '没有权限访问该资源',
    NOT_FOUND_ERROR: '请求资源未找到'
}

export const YES_OR_NO = [
    { label: '是', value: 1 },
    { label: '否', value: 0 }
]

export const PHONE_REG = /^1[3-9]\d{9}$/;

export const EMAIL_REG = /^[^\s@]+@[^\s@]+\.[^\s@]=$/;

export const CHINESE_REG = /[\u4e00-\u9fa5]/;

export const APP_ROUTE_NAME = 'main';

export const COMPONENT_DATA: LabelOptionList = [
    { label: '输入框', value: 'input' },
    { label: '数字输入框', value: 'inputNumber' },
    { label: '选择器', value: 'select' },
    { label: '多选框', value: 'checkbox' },
    { label: '单选框', value: 'radio' },
    { label: '时间选择器', value: 'datePicker' },
    { label: '时间范围选择器', value: 'dateRangePicker' },
    { label: '文本域', value: 'textarea' },
]

export const ROUTER_ANIMATION_DATA: LabelOptionList = [
    { label: '无动画', value: 'none' },
    { label: '显隐', value: 'fade' },
    { label: '偏移', value: 'translate' },
    { label: '缩放', value: 'scale' }
]

export const YES_OR_NO_BOOL: LabelOptionList = [
    { label: '是', value: true },
    { label: '否', value: false }
]

export const MENU_TYPE: LabelOptionList = [
    { label: '目录', value: '1' },
    { label: '按钮', value: '2' },
]

export const AUTH_TYPE: LabelOptionList = [
    { label: '需要', value: 1 },
    { label: '无需登录', value: 0 },
]

export const LOG_BUSINESS: LabelOptionList = [
    { label: '创建', value: 0 },
    { label: '修改', value: 1 },
    { label: '删除', value: 2 },
    { label: '查看', value: 3 },
    { label: '列表', value: 4 },
    { label: '上传', value: 5 },
    { label: '导出', value: 6 },
    { label: '导入', value: 7 },
    { label: '登录', value: 8 },
    { label: '其他', value: 9 },
]

export const LOG_OPER: LabelOptionList = [
    { label: '手机', value: 0 },
    { label: '电脑', value: 1 },
    { label: '其他', value: 2 },
]

