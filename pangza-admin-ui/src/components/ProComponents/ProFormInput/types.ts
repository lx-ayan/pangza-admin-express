import type { FormItemProps, TdInputAdornmentProps, TdInputProps } from "tdesign-vue-next";

export interface ProFormInputProps {
    name: string;
    inputProps?: TdInputProps;
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    inputAdornmentProps?: TdInputAdornmentProps;
    /** 填充风格：默认灰底，聚焦变白 */
    filled?: boolean;
}

export interface ProFormInputInstance {
    focus: () => void;
    blur: () => void;
    clear: () => void;
}