import { type FormItemProps, type TdDatePickerProps } from 'tdesign-vue-next';


export interface ProFormDatePickerProps {
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    datePickerProps?: TdDatePickerProps;
    /** 填充风格：默认灰底，聚焦变白 */
    filled?: boolean;
}