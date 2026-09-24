import type { FormItemProps, TdTextareaProps } from "tdesign-vue-next";

export interface ProFormTextareaProps {
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    textareaProps?: TdTextareaProps;
    /** 填充风格：默认灰底，聚焦变白 */
    filled?: boolean;
}