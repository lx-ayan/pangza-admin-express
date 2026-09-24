/** 表单组件类型 */
export type FormComponentType =
    | 'input'
    | 'textarea'
    | 'password'
    | 'inputNumber'
    | 'select'
    | 'cascader'
    | 'radio'
    | 'checkbox'
    | 'switch'
    | 'slider'
    | 'timePicker'
    | 'timeRangePicker'
    | 'datePicker'
    | 'dateRangePicker'
    | 'rate'
    | 'colorPicker'
    | 'upload'
    | 'row'
    | 'button';

/** 选项 */
export interface FormOptionItem {
    label: string;
    value: string | number;
}

/** 设计器表单项 */
export interface FormDesignerItem {
    id: string;
    type: FormComponentType;
    label: string;
    field: string;
    placeholder?: string;
    defaultValue?: string | number | boolean | string[];
    span?: number;
    width?: string;
    maxLength?: number;
    showLimitNumber?: boolean;
    clearable?: boolean;
    readonly?: boolean;
    disabled?: boolean;
    required?: boolean;
    prefixText?: string;
    suffixText?: string;
    options?: FormOptionItem[];
    min?: number;
    max?: number;
    step?: number;
    buttonText?: string;
    buttonTheme?: 'default' | 'primary' | 'danger' | 'warning' | 'success';
    children?: FormDesignerItem[];
}

/** 表单全局配置 */
export interface FormDesignerConfig {
    labelWidth: number | string;
    labelAlign: 'left' | 'right' | 'top';
    colon: boolean;
    size: 'small' | 'medium' | 'large';
}

/** 组件面板项 */
export interface PaletteItem {
    type: FormComponentType;
    label: string;
    icon: string;
}

/** 组件分组 */
export interface PaletteGroup {
    title: string;
    items: PaletteItem[];
}
