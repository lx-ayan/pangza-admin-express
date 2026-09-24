import type { CodeGenConfig } from './types';
import { toClassName } from '@/views/tools/database/utils/generateTableCode';

export const DEFAULT_PACKAGE_NAME = 'cn.pangza.service.entity.tool';
export const DEFAULT_AUTHOR = 'pangza';

export const TPL_CATEGORY_OPTIONS = [
    { label: '单表（增删改查）', value: 'crud' },
];

export const GEN_TYPE_OPTIONS = [
    { label: 'zip压缩包', value: 'zip' },
    { label: '自定义路径', value: 'custom' },
];

export const JAVA_TYPE_OPTIONS = [
    { label: 'String', value: 'String' },
    { label: 'Long', value: 'Long' },
    { label: 'Integer', value: 'Integer' },
    { label: 'BigDecimal', value: 'BigDecimal' },
    { label: 'Date', value: 'Date' },
    { label: 'LocalDateTime', value: 'LocalDateTime' },
    { label: 'Boolean', value: 'Boolean' },
];

export const QUERY_TYPE_OPTIONS = [
    { label: '=', value: '=' },
    { label: 'LIKE', value: 'LIKE' },
    { label: 'BETWEEN', value: 'BETWEEN' },
];

export const HTML_TYPE_OPTIONS = [
    { label: '文本框', value: 'input' },
    { label: '文本域', value: 'textarea' },
    { label: '选择器', value: 'select' },
    { label: '单选框', value: 'radio' },
    { label: '多选框', value: 'checkbox' },
    { label: '日期控件', value: 'datePicker' },
    { label: '数字输入框', value: 'inputNumber' },
];

/** 创建默认代码生成配置 */
export function createDefaultGenConfig(tableName = 't_demo', tableComment = ''): CodeGenConfig {
    const entityName = toClassName(tableName);
    const businessName = tableName.replace(/^t_/, '').replace(/_/g, '');

    return {
        entityName,
        author: DEFAULT_AUTHOR,
        remark: '',
        tplCategory: 'crud',
        packageName: DEFAULT_PACKAGE_NAME,
        moduleName: 'data',
        businessName,
        functionName: tableComment || entityName,
        genType: 'zip',
        parentMenuId: '',
        genDetailPage: false,
    };
}

/** 下划线转驼峰 */
export function snakeToCamel(value: string) {
    return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}

/** 映射 Java 类型 */
export function mapJavaType(fieldType: string) {
    switch (fieldType) {
        case 'bigint':
            return 'Long';
        case 'int':
        case 'tinyint':
            return 'Integer';
        case 'decimal':
            return 'BigDecimal';
        case 'datetime':
            return 'LocalDateTime';
        default:
            return 'String';
    }
}

/** 映射显示类型 */
export function mapHtmlType(advancedSearchType?: string, fieldType?: string) {
    if (fieldType === 'datetime') {
        return 'datePicker';
    }
    return advancedSearchType || 'input';
}
