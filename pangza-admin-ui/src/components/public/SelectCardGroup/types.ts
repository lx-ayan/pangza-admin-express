/** 卡片选择选项 */
export interface SelectCardOption {
    /** 选项值 */
    value: string | number;
    /** 主标题 */
    label: string;
    /** 描述文案 */
    description?: string;
    /** 是否禁用 */
    disabled?: boolean;
}
