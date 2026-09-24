import type { TableConfig, TableFieldConfig } from './types';

export const DRAFT_STORAGE_KEY = 'tools-database-draft';

/** SQL 字段类型选项 */
export const FIELD_TYPE_OPTIONS = [
    { label: 'varchar', value: 'varchar' },
    { label: 'int', value: 'int' },
    { label: 'bigint', value: 'bigint' },
    { label: 'decimal', value: 'decimal' },
    { label: 'datetime', value: 'datetime' },
    { label: 'text', value: 'text' },
    { label: 'tinyint', value: 'tinyint' },
];

/** 高级搜索/表单组件类型 */
export const SEARCH_TYPE_OPTIONS = [
    { label: '输入框', value: 'input' },
    { label: '数字输入框', value: 'inputNumber' },
    { label: '选择器', value: 'select' },
    { label: '多选框', value: 'checkbox' },
    { label: '单选框', value: 'radio' },
    { label: '时间选择器', value: 'datePicker' },
    { label: '时间范围选择器', value: 'dateRangePicker' },
    { label: '文本域', value: 'textarea' },
];

/** 导入配置示例 */
export const IMPORT_CONFIG_EXAMPLE = {
    tableName: 'test_table',
    tableComment: '测试表格',
    fieldList: [
        {
            fieldName: 'username',
            mockType: 'username',
            comment: '用户名',
            fieldType: 'varchar',
            primaryKey: false,
            autoIncrement: false,
            notNull: true,
            indexed: false,
        },
        {
            fieldName: 'city',
            mockType: 'city',
            comment: '城市',
            fieldType: 'varchar',
        },
    ],
};

/** 创建唯一字段 ID */
export function createFieldId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 创建默认字段配置 */
export function createDefaultField(overrides: Partial<TableFieldConfig> = {}): TableFieldConfig {
    return {
        id: createFieldId(),
        fieldName: 'demo',
        fieldType: 'varchar',
        defaultValue: '',
        comment: '',
        mockType: '',
        primaryKey: false,
        autoIncrement: false,
        notNull: false,
        indexed: false,
        mybatis: true,
        swagger: true,
        hideInSearch: false,
        hideInTable: false,
        formSlot: false,
        searchSlot: false,
        advancedSearchType: 'input',
        hideInForm: false,
        disabled: false,
        readOnly: false,
        ...overrides,
    };
}

/** 基础审计字段预设（与 BaseEntity 一致） */
export const BASE_ENTITY_FIELD_PRESETS: Partial<TableFieldConfig>[] = [
    {
        fieldName: 'create_time',
        fieldType: 'datetime',
        comment: '创建时间',
        hideInForm: true,
        hideInSearch: true,
    },
    {
        fieldName: 'create_by',
        fieldType: 'varchar',
        comment: '创建人',
        hideInForm: true,
        hideInSearch: true,
    },
    {
        fieldName: 'update_time',
        fieldType: 'datetime',
        comment: '更新时间',
        hideInForm: true,
        hideInSearch: true,
    },
    {
        fieldName: 'update_by',
        fieldType: 'varchar',
        comment: '更新人',
        hideInForm: true,
        hideInSearch: true,
    },
    {
        fieldName: 'delete_flag',
        fieldType: 'tinyint',
        comment: '删除标记',
        defaultValue: '0',
        hideInForm: true,
        hideInSearch: true,
        hideInTable: true,
    },
];

/** 创建默认表格配置 */
export function createDefaultTableConfig(): TableConfig {
    return {
        tableName: 't_user',
        tableComment: '用户',
        fieldList: [createDefaultField()],
    };
}
