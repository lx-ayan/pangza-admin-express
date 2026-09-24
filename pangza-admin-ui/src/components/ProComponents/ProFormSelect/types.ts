import type { FormItemProps, TdSelectProps } from 'tdesign-vue-next';

export interface ProFormSelectProps {
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    keyname?: string;
    valuename?: string;
    data?: OptionData[] | (() => OptionData[]) | (() => Promise<OptionData[]>);
    selectProps?: TdSelectProps;
    /** 填充风格：默认灰底，聚焦变白 */
    filled?: boolean;
}
