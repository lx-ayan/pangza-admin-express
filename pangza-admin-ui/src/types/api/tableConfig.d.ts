export interface TableConfig {
    id: string;
    tableName: string;
    tableComment: string;
    fieldConfig: string;
    sortNum?: number;
    createTime?: string;
    updateTime?: string;
}

export type CreateTableConfigDTO = ExcludeAndPartial<TableConfig, 'id' | 'createTime' | 'updateTime'>;

export type UpdateTableConfigDTO = TableConfig;

export interface TableConfigListDTO {
    keyword?: string;
    tableName?: string;
    tableComment?: string;
}

export interface TableConfigPageDTO {
    keyword?: string;
    tableName?: string;
    tableComment?: string;
    beginDate?: string;
    endDate?: string;
}
