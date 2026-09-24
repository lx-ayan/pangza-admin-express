import type { FormDesignerConfig, FormOptionItem, PaletteGroup } from './types';

export const DEFAULT_FORM_OPTIONS: FormOptionItem[] = [
    { label: '选项一', value: '1' },
    { label: '选项二', value: '2' },
    { label: '选项三', value: '3' },
];

export const DEFAULT_CASCADER_OPTIONS = [
    {
        label: '选项一',
        value: '1',
        children: [
            { label: '子选项一', value: '1-1' },
            { label: '子选项二', value: '1-2' },
        ],
    },
    {
        label: '选项二',
        value: '2',
        children: [
            { label: '子选项一', value: '2-1' },
        ],
    },
];

export const DEFAULT_FORM_CONFIG: FormDesignerConfig = {
    labelWidth: 100,
    labelAlign: 'right',
    colon: true,
    size: 'medium',
};

export const COMPONENT_GROUPS: PaletteGroup[] = [
    {
        title: '输入型组件',
        items: [
            { type: 'input', label: '单行文本', icon: 'Type' },
            { type: 'textarea', label: '多行文本', icon: 'FileText' },
            { type: 'password', label: '密码', icon: 'Lock' },
            { type: 'inputNumber', label: '计数器', icon: 'Hash' },
        ],
    },
    {
        title: '选择型组件',
        items: [
            { type: 'select', label: '下拉选择', icon: 'ChevronDown' },
            { type: 'cascader', label: '级联选择', icon: 'GitBranch' },
            { type: 'radio', label: '单选框组', icon: 'CircleDot' },
            { type: 'checkbox', label: '多选框组', icon: 'CheckSquare' },
            { type: 'switch', label: '开关', icon: 'ToggleLeft' },
            { type: 'slider', label: '滑块', icon: 'SlidersHorizontal' },
            { type: 'timePicker', label: '时间选择', icon: 'Clock' },
            { type: 'timeRangePicker', label: '时间范围', icon: 'Clock3' },
            { type: 'datePicker', label: '日期选择', icon: 'Calendar' },
            { type: 'dateRangePicker', label: '日期范围', icon: 'CalendarRange' },
            { type: 'rate', label: '评分', icon: 'Star' },
            { type: 'colorPicker', label: '颜色选择', icon: 'Palette' },
            { type: 'upload', label: '上传', icon: 'Upload' },
        ],
    },
    {
        title: '布局型组件',
        items: [
            { type: 'row', label: '行容器', icon: 'LayoutGrid' },
            { type: 'button', label: '按钮', icon: 'Square' },
        ],
    },
];

export const LABEL_ALIGN_OPTIONS = [
    { label: '左对齐', value: 'left' },
    { label: '右对齐', value: 'right' },
    { label: '顶部对齐', value: 'top' },
];

export const FORM_SIZE_OPTIONS = [
    { label: '小', value: 'small' },
    { label: '中', value: 'medium' },
    { label: '大', value: 'large' },
];

export const BUTTON_THEME_OPTIONS = [
    { label: '默认', value: 'default' },
    { label: '主要', value: 'primary' },
    { label: '危险', value: 'danger' },
    { label: '警告', value: 'warning' },
    { label: '成功', value: 'success' },
];

/** 组件类型选项（属性面板） */
export const COMPONENT_TYPE_OPTIONS = COMPONENT_GROUPS.flatMap((group) => (
    group.items.map((item) => ({
        label: item.label,
        value: item.type,
    }))
));
