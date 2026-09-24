import type { TableFieldConfig } from '@/views/tools/database/types';
import type { FormComponentType, FormDesignerItem } from '../types';
import { createFormItem } from './createFormItem';

const SEARCH_TYPE_MAP: Record<string, FormComponentType> = {
    input: 'input',
    inputNumber: 'inputNumber',
    select: 'select',
    checkbox: 'checkbox',
    radio: 'radio',
    datePicker: 'datePicker',
    dateRangePicker: 'dateRangePicker',
    textarea: 'textarea',
};

/** 解析字段默认值为表单项默认值 */
function parseDefaultValue(field: TableFieldConfig, type: FormComponentType) {
    const raw = field.defaultValue?.trim();
    if (!raw) {
        return undefined;
    }
    if (type === 'inputNumber' || type === 'slider') {
        const num = Number(raw);
        return Number.isNaN(num) ? undefined : num;
    }
    if (type === 'switch') {
        return raw === '1' || raw === 'true';
    }
    if (type === 'checkbox') {
        return raw.split(',').map((item) => item.trim()).filter(Boolean);
    }
    return raw;
}

/** 根据 SQL 字段类型推断组件类型 */
function resolveTypeByFieldType(fieldType: string): FormComponentType {
    switch (fieldType) {
        case 'text':
            return 'textarea';
        case 'int':
        case 'bigint':
        case 'decimal':
        case 'tinyint':
            return 'inputNumber';
        case 'datetime':
            return 'datePicker';
        default:
            return 'input';
    }
}

/** 解析库表字段对应的表单组件类型 */
function resolveComponentType(field: TableFieldConfig): FormComponentType | null {
    if (field.hideInForm) {
        return null;
    }
    if (field.primaryKey && field.autoIncrement) {
        return null;
    }
    if (field.advancedSearchType && SEARCH_TYPE_MAP[field.advancedSearchType]) {
        return SEARCH_TYPE_MAP[field.advancedSearchType];
    }
    return resolveTypeByFieldType(field.fieldType);
}

/** 根据库表字段批量创建表单项 */
export function createFormItemsFromTable(fields: TableFieldConfig[]): FormDesignerItem[] {
    return fields
        .filter((field) => field.fieldName.trim())
        .map((field) => {
            const type = resolveComponentType(field);
            if (!type) {
                return null;
            }
            const label = field.comment || field.fieldName;
            const item = createFormItem(type, label);
            item.field = field.fieldName;
            item.label = label;
            item.required = field.notNull;
            item.disabled = field.disabled;
            item.readonly = field.readOnly;

            const defaultValue = parseDefaultValue(field, type);
            if (defaultValue !== undefined) {
                item.defaultValue = defaultValue;
            }

            if (type === 'inputNumber' && field.fieldType === 'decimal') {
                item.step = 0.01;
            }

            return item;
        })
        .filter((item): item is FormDesignerItem => Boolean(item));
}
