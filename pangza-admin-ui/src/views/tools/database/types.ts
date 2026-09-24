/** 表格字段配置 */
export interface TableFieldConfig {
    id: string;
    fieldName: string;
    fieldType: string;
    defaultValue: string;
    comment: string;
    mockType: string;
    primaryKey: boolean;
    autoIncrement: boolean;
    notNull: boolean;
    indexed: boolean;
    mybatis: boolean;
    swagger: boolean;
    hideInSearch: boolean;
    hideInTable: boolean;
    formSlot: boolean;
    searchSlot: boolean;
    advancedSearchType: string;
    hideInForm: boolean;
    disabled: boolean;
    readOnly: boolean;
}

/** 表格配置 */
export interface TableConfig {
    tableName: string;
    tableComment: string;
    fieldList: TableFieldConfig[];
}

/** 已保存的表格配置 */
export interface SavedTableConfig extends TableConfig {
    id: string;
    savedAt: number;
}

/** 代码生成结果 */
export interface TableCodeGenerateResult {
    typescript: string;
    java: string;
    sqlCreate: string;
    sqlInsert: string;
    json: string;
    proTable: string;
    proForm: string;
}
