import { type TdButtonProps, type TdFormProps, type FormRule, type Data, type FormValidateResult } from "tdesign-vue-next";
import { type VNode } from "vue";
import type { ProFormInputProps } from "../ProFormInput/types";
import type { ProFormCheckProps } from "../ProFormCheckbox/types";
import type { ProFormRadioProps } from "../ProFormRadio/types";
import type { ProFormDatePickerProps } from "../ProFormDatePicker/types";
import type { ProFormDateRangePickerProps } from "../ProFormDateRangePicker/types";
import type { ProFormInputNumberProps } from "../ProFormInputNumber/types";
import type { ProFormTextareaProps } from "../ProFormTextarea/types";
import type { ProFormSelectProps } from "../ProFormSelect/types";

export interface FormItemPropsMap {
    'input': ProFormInputProps;
    'select': ProFormSelectProps;
    'checkbox': ProFormCheckProps;
    'radio': ProFormRadioProps;
    'datePicker': ProFormDatePickerProps;
    'dateRangePicker': ProFormDateRangePickerProps;
    'inputNumber': ProFormInputNumberProps;
    'textarea': ProFormTextareaProps;
}

export interface ProFormProps {
    options: ProFormOption[];
    cols?: number;
    gap?: { x?: number, y?: number };
    formProps?: TdFormProps;
    submitButtonProps?: TdButtonProps;
    resetButtonProps?: TdButtonProps;
    hideExtra?: boolean;
    hideReset?: boolean;
    submitText?: string;
    resetText?: string;
    filterEmpty?: boolean;
    request?: () => (any | Promise<any>);
    submit?: (data: any) => any;
    fail?: (e: any) => any;
    modelValue?: Record<string, any>;
    stopRequest?: boolean;
    /** 整表启用填充风格：默认灰底，聚焦变白 */
    filled?: boolean;
}

export interface ProFormOption<K extends keyof FormItemPropsMap = keyof FormItemPropsMap | 'input'> {
    name: string;
    type?: K | Function;
    label?: string | Function;
    data?: OptionDataProps;
    props?: Optional<FormItemPropsMap[K], 'name'> | Record<string, any>;
    disabled?: boolean;
    readonly?: boolean;
    slots?: any;
    rules?: FormRule[];
    hidden?: boolean | ((formModel: any, key: string) => boolean);
    placeholder?: string;
    defaultValue?: any;
    gridProps?: {
        colSpan?: number;
    };
    render?: (model: any, key: string, option: ProFormOption) => VNode;
}

export interface ProFormInstance {
    submit: () => any;
    validate: () => Promise<FormValidateResult<Data>>;
    reset: () => void;
    setFormItem: (key: string, value: any) => void;
    getFormItem: (key: string) => any;
    getFormValue: () => any;
    request: () => void;
}
