import type { SavedTableConfig, TableConfig, TableFieldConfig } from '../types';
import type { TableConfig as TableConfigEntity } from '@/types/api/tableConfig';
import { createDefaultField } from '../constants';

/** field_config 包装结构（代码生成配置存在 genConfig 中） */
export interface FieldConfigPackage {
    fields: TableFieldConfig[];
    genConfig?: Record<string, unknown>;
}

function mapFieldList(fields: Partial<TableFieldConfig>[]): TableFieldConfig[] {
    return fields.map((field, index) => createDefaultField({
        ...field,
        fieldName: field.fieldName || `field_${index + 1}`,
    }));
}

/** 解析 field_config 完整结构 */
export function parseFieldConfigPackage(fieldConfig?: string): FieldConfigPackage {
    if (!fieldConfig) {
        return { fields: [] };
    }
    try {
        const parsed = JSON.parse(fieldConfig) as Partial<TableFieldConfig>[] | FieldConfigPackage;
        if (Array.isArray(parsed)) {
            return { fields: mapFieldList(parsed) };
        }
        if (parsed && Array.isArray(parsed.fields)) {
            return {
                fields: mapFieldList(parsed.fields),
                genConfig: parsed.genConfig,
            };
        }
        return { fields: [] };
    } catch {
        return { fields: [] };
    }
}

/** 将页面配置转为接口参数 */
export function toTableConfigPayload(config: TableConfig) {
    return {
        tableName: config.tableName,
        tableComment: config.tableComment,
        fieldConfig: JSON.stringify(config.fieldList),
    };
}

/** 解析接口字段配置 */
export function parseFieldConfig(fieldConfig?: string): TableFieldConfig[] {
    return parseFieldConfigPackage(fieldConfig).fields;
}

/** 将接口实体转为页面已保存配置 */
export function toSavedTableConfig(entity: TableConfigEntity): SavedTableConfig {
    return {
        id: entity.id,
        tableName: entity.tableName,
        tableComment: entity.tableComment || '',
        fieldList: parseFieldConfig(entity.fieldConfig),
        savedAt: entity.createTime ? new Date(entity.createTime).getTime() : Date.now(),
    };
}

/** 将页面配置转为接口实体 */
export function toTableConfigEntity(config: TableConfig, id?: string): TableConfigEntity {
    return {
        id: id || '',
        tableName: config.tableName,
        tableComment: config.tableComment,
        fieldConfig: JSON.stringify(config.fieldList),
    };
}
