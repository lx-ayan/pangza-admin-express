
import type { FormItemProps, TdCheckboxGroupProps } from 'tdesign-vue-next';

export interface ProFormCheckProps {
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    keyname?: string;
    valuename?: string;
    data?: OptionDataProps;
    checkboxProps?: TdCheckboxGroupProps;
}
