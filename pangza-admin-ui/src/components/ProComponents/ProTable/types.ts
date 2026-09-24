import { type BaseTableCol, type BaseTableProps, type TableCol, type TableInstanceFunctions, type TableProps, type TableTreeConfig, type TdFormItemProps, type TdPaginationProps, type EnhancedTableInstanceFunctions } from 'tdesign-vue-next';
import type { FormItemPropsMap, ProFormInstance, ProFormOption, ProFormProps } from '../ProForm/types';

export interface ProTableProps {
    options: ProTableOption[];
    data?: any[];
    request?: (data: any) => (ProTableResult | Promise<ProTableResult>);
    formProps?: Optional<ProFormProps, 'options'>;
    hideForm?: boolean;
    hidePage?: boolean;
    draggAble?: boolean;
    selectAble?: boolean;
    tableProps?: TableProps;
    rowKey?: string;
    selectType?: 'multiple' | 'single';
    pageProps?: TdPaginationProps;
    /**
     * 树形表格：传 true 使用默认配置，或传入 TDesign TableTreeConfig。
     * 开启后内部使用 EnhancedTable（t-enhanced-table）。
     */
    tree?: boolean | TableTreeConfig;
}

export interface ProTableResult<T = any> {
    list: T[];
    total: number;
    pageSize?: number;
    pageNum?: number;
    pages?: number;
    [key: string]: any;
}

export interface ProTableOption<T = any, K extends keyof FormItemPropsMap = 'input'> {
    key: string;
    label?: string;
    formLabel?: TdFormItemProps['label'];
    tableTitle?: BaseTableProps['columns'][number]['title'];
    span?: number;
    type?: ProFormOption['type'];
    data?: ProFormOption['data'];
    hideInSearch?: boolean | (() => boolean);
    hideInTable?: boolean | (() => boolean);
    tableProps?: BaseTableCol;
    formProps?: Optional<FormItemPropsMap[K], 'name'> | Record<string, any>;
    formSlots?: any;
    defaultValue?: any;
    edit?: TableCol['edit'];
    render?: (row: T, rowIndex: number) => any;
}

export interface ProTableInstance {
    getFormValue: () => any;
    reset: () => void;
    reload: () => void;
    validate: TableInstanceFunctions['validateTableData'],
    clearValidate: TableInstanceFunctions['clearValidateData'],
    getFormInstance: () => ProFormInstance,
    getTableInstance: () => TableInstanceFunctions | EnhancedTableInstanceFunctions
    /** 树形表格：展开全部 */
    expandAll?: () => void;
    /** 树形表格：收起全部 */
    foldAll?: () => void;
}

export interface ProTableRequest<T = any> {
    pageNum: number;
    pageSize: number;
    form: T;
    sort?: Record<string, 'asc' | 'desc'>
}
