import type { TableFieldConfig } from '@/views/tools/database/types';

/** 代码生成配置 */
export interface CodeGenConfig {
    entityName: string;
    author: string;
    remark: string;
    tplCategory: string;
    packageName: string;
    moduleName: string;
    businessName: string;
    functionName: string;
    genType: string;
    parentMenuId: string;
    genDetailPage: boolean;
}

/** 代码生成字段配置 */
export interface CodeGenField extends TableFieldConfig {
    javaType: string;
    javaField: string;
    isInsert: boolean;
    isEdit: boolean;
    isList: boolean;
    isQuery: boolean;
    queryType: string;
    isRequired: boolean;
    htmlType: string;
    dictType: string;
}

/** 代码生成完整模型 */
export interface CodeGenModel {
    id?: string;
    tableName: string;
    tableComment: string;
    genConfig: CodeGenConfig;
    fieldList: CodeGenField[];
}

/** 代码文件项 */
export interface CodeFileItem {
    key: string;
    label: string;
    language: string;
    code: string;
    zipPath: string;
}
