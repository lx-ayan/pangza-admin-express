import { DEFAULT_CASCADER_OPTIONS, DEFAULT_FORM_OPTIONS } from '../constants';
import type { FormComponentType, FormDesignerItem } from '../types';

let fieldIndex = 0;

function createFieldId() {
    fieldIndex += 1;
    return `field_${Date.now()}_${fieldIndex}`;
}

/** 创建表单项 */
export function createFormItem(type: FormComponentType, label?: string): FormDesignerItem {
    const id = createFieldId();
    const base: FormDesignerItem = {
        id,
        type,
        label: label || '表单项',
        field: `field_${id.slice(-6)}`,
        span: 24,
        width: '100%',
        clearable: true,
        readonly: false,
        disabled: false,
        required: false,
        showLimitNumber: false,
    };

    switch (type) {
        case 'input':
            return { ...base, label: label || '单行文本', placeholder: '请输入' };
        case 'textarea':
            return { ...base, label: label || '多行文本', placeholder: '请输入' };
        case 'password':
            return { ...base, label: label || '密码', placeholder: '请输入密码' };
        case 'inputNumber':
            return { ...base, label: label || '计数器', defaultValue: 0, min: 0, max: 100, step: 1 };
        case 'select':
            return { ...base, label: label || '下拉选择', placeholder: '请选择', options: [...DEFAULT_FORM_OPTIONS] };
        case 'cascader':
            return { ...base, label: label || '级联选择', placeholder: '请选择', options: JSON.parse(JSON.stringify(DEFAULT_CASCADER_OPTIONS)) as FormDesignerItem['options'] };
        case 'radio':
            return { ...base, label: label || '单选框组', defaultValue: '1', options: [...DEFAULT_FORM_OPTIONS] };
        case 'checkbox':
            return { ...base, label: label || '多选框组', defaultValue: ['1'], options: [...DEFAULT_FORM_OPTIONS] };
        case 'switch':
            return { ...base, label: label || '开关', defaultValue: false };
        case 'slider':
            return { ...base, label: label || '滑块', defaultValue: 0, min: 0, max: 100, step: 1 };
        case 'timePicker':
            return { ...base, label: label || '时间选择', placeholder: '请选择时间' };
        case 'timeRangePicker':
            return { ...base, label: label || '时间范围', defaultValue: [] };
        case 'datePicker':
            return { ...base, label: label || '日期选择', placeholder: '请选择日期' };
        case 'dateRangePicker':
            return { ...base, label: label || '日期范围', defaultValue: [] };
        case 'rate':
            return { ...base, label: label || '评分', defaultValue: 0, max: 5 };
        case 'colorPicker':
            return { ...base, label: label || '颜色选择', defaultValue: '#0052D9' };
        case 'upload':
            return { ...base, label: label || '上传', buttonText: '点击上传' };
        case 'row':
            return { ...base, label: label || '行容器', field: `row_${id.slice(-6)}`, children: [] };
        case 'button':
            return {
                ...base,
                label: label || '按钮',
                field: `button_${id.slice(-6)}`,
                buttonText: '按钮',
                buttonTheme: 'primary',
            };
        default:
            return base;
    }
}

/** 复制表单项 */
export function cloneFormItem(item: FormDesignerItem): FormDesignerItem {
    const cloned = createFormItem(item.type, item.label);
    return {
        ...JSON.parse(JSON.stringify(item)) as FormDesignerItem,
        id: cloned.id,
        field: `${item.field}_copy`,
        children: item.children?.map((child) => cloneFormItem(child)),
    };
}

const OPTION_TYPES: FormComponentType[] = ['select', 'radio', 'checkbox', 'cascader'];

/** 切换组件类型，保留字段名、标题等通用属性 */
export function changeFormItemType(item: FormDesignerItem, newType: FormComponentType): FormDesignerItem {
    if (item.type === newType) {
        return item;
    }
    const next = createFormItem(newType, item.label);
    next.id = item.id;
    next.field = item.field;
    next.label = item.label;
    next.span = item.span ?? next.span;
    next.width = item.width ?? next.width;
    next.required = item.required;
    next.disabled = item.disabled;
    next.readonly = item.readonly;

    if (OPTION_TYPES.includes(newType) && OPTION_TYPES.includes(item.type) && item.options?.length) {
        next.options = JSON.parse(JSON.stringify(item.options));
    }

    if (newType === 'row') {
        next.children = item.type === 'row' ? (item.children ?? []) : [];
    }

    if (newType === 'button') {
        next.buttonText = item.buttonText || item.label || '按钮';
    }

    return next;
}
