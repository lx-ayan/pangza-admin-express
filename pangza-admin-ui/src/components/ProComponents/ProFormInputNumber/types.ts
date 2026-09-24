import type { FormItemProps, TdInputAdornmentProps, TdInputNumberProps } from "tdesign-vue-next";

export interface ProFormInputNumberProps {
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    inputAdornmentProps?: TdInputAdornmentProps;
    inputNumberProps?: TdInputNumberProps;
    /** 填充风格：默认灰底，聚焦变白 */
    filled?: boolean;
}