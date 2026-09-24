import type { TableConfig as TableConfigEntity } from '@/types/api/tableConfig';
import { createDefaultField } from '@/views/tools/database/constants';
import type { TableFieldConfig } from '@/views/tools/database/types';
import { parseFieldConfigPackage } from '@/views/tools/database/utils/tableConfigMapper';
import {
    createDefaultGenConfig,
    mapHtmlType,
    mapJavaType,
    snakeToCamel,
} from '../constants';
import type { CodeGenConfig, CodeGenField, CodeGenModel } from '../types';

/** 转为代码生成字段 */
export function toCodeGenField(field: Partial<TableFieldConfig>, index = 0): CodeGenField {
    const base = createDefaultField({
        ...field,
        fieldName: field.fieldName || `field_${index + 1}`,
    });
    const javaField = (field as CodeGenField).javaField || snakeToCamel(base.fieldName);

    return {
        ...base,
        javaType: (field as CodeGenField).javaType || mapJavaType(base.fieldType),
        javaField,
        isInsert: (field as CodeGenField).isInsert ?? (!base.primaryKey && !base.autoIncrement),
        isEdit: (field as CodeGenField).isEdit ?? true,
        isList: (field as CodeGenField).isList ?? !base.hideInTable,
        isQuery: (field as CodeGenField).isQuery ?? !base.hideInSearch,
        queryType: (field as CodeGenField).queryType || (base.fieldType === 'varchar' ? 'LIKE' : '='),
        isRequired: (field as CodeGenField).isRequired ?? base.notNull,
        htmlType: (field as CodeGenField).htmlType || mapHtmlType(base.advancedSearchType, base.fieldType),
        dictType: (field as CodeGenField).dictType || '',
    };
}

/** 解析代码生成配置 */
export function parseGenConfig(genConfig?: string | Record<string, unknown>, tableName = '', tableComment = ''): CodeGenConfig {
    if (!genConfig) {
        return createDefaultGenConfig(tableName, tableComment);
    }
    try {
        const parsed = (typeof genConfig === 'string' ? JSON.parse(genConfig) : genConfig) as Partial<CodeGenConfig>;
        return {
            ...createDefaultGenConfig(tableName, tableComment),
            ...parsed,
        };
    } catch {
        return createDefaultGenConfig(tableName, tableComment);
    }
}

/** 接口实体转代码生成模型 */
export function toCodeGenModel(entity: TableConfigEntity): CodeGenModel {
    const { fields, genConfig } = parseFieldConfigPackage(entity.fieldConfig);

    return {
        id: entity.id,
        tableName: entity.tableName,
        tableComment: entity.tableComment || '',
        genConfig: parseGenConfig(genConfig, entity.tableName, entity.tableComment),
        fieldList: fields.map((field, index) => toCodeGenField(field, index)),
    };
}

/** 代码生成模型转接口参数 */
export function toTableConfigPayload(model: CodeGenModel) {
    return {
        tableName: model.tableName,
        tableComment: model.tableComment,
        fieldConfig: JSON.stringify({
            fields: model.fieldList,
            genConfig: model.genConfig,
        }),
    };
}

/** 同步实体名与 Java 属性 */
export function syncCodeGenModel(model: CodeGenModel): CodeGenModel {
    const genConfig = {
        ...model.genConfig,
        entityName: model.genConfig.entityName || createDefaultGenConfig(model.tableName, model.tableComment).entityName,
        functionName: model.genConfig.functionName || model.tableComment,
        businessName: model.genConfig.businessName || model.tableName.replace(/^t_/, '').replace(/_/g, ''),
    };

    const fieldList = model.fieldList.map((field, index) => toCodeGenField({
        ...field,
        javaField: field.javaField || snakeToCamel(field.fieldName),
        javaType: field.javaType || mapJavaType(field.fieldType),
    }, index));

    return {
        ...model,
        genConfig,
        fieldList,
    };
}
