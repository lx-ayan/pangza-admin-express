
import { type FormItemProps, type TdDateRangePickerProps } from 'tdesign-vue-next';

export interface ProFormDateRangePickerProps {
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    datePickerProps?: TdDateRangePickerProps;
}
