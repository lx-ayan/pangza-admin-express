import type { FormItemProps, TdRadioGroupProps } from 'tdesign-vue-next';

export interface ProFormRadioProps {
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    keyname?: string;
    valuename?: string;
    data?: OptionData[] | (() => OptionData[]) | (() => Promise<OptionData[]>);
    radioProps?: TdRadioGroupProps;
}