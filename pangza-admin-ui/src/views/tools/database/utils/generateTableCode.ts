import type { TableCodeGenerateResult, TableConfig, TableFieldConfig } from '../types';

/** 表名转 Java/TS 类名 */
export function toClassName(tableName: string) {
    const normalized = tableName.replace(/^t_/, '');
    return normalized
        .split('_')
        .filter(Boolean)
        .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
        .join('');
}

/** SQL 字符串转义 */
function escapeSqlValue(value: string) {
    return value.replace(/'/g, "''");
}

/** SQL 注释转义 */
function escapeSqlComment(value: string) {
    return value.replace(/'/g, '');
}

/** 字段 SQL 类型定义 */
function buildSqlColumnType(field: TableFieldConfig) {
    switch (field.fieldType) {
        case 'varchar':
            return 'varchar(255)';
        case 'int':
            return 'int(11)';
        case 'bigint':
            return 'bigint(20)';
        case 'decimal':
            return 'decimal(10, 2)';
        case 'datetime':
            return 'datetime';
        case 'text':
            return 'text';
        case 'tinyint':
            return 'tinyint(1)';
        default:
            return field.fieldType;
    }
}

/** TypeScript 字段类型 */
function toTsType(fieldType: string) {
    if (['int', 'bigint', 'decimal', 'tinyint'].includes(fieldType)) {
        return 'number';
    }
    return 'string';
}

/** Java 字段类型 */
function toJavaType(fieldType: string) {
    switch (fieldType) {
        case 'int':
            return 'Integer';
        case 'bigint':
            return 'Long';
        case 'decimal':
            return 'BigDecimal';
        case 'datetime':
            return 'LocalDateTime';
        case 'tinyint':
            return 'Integer';
        default:
            return 'String';
    }
}

/** 构建单列 SQL 定义 */
function buildColumnSql(field: TableFieldConfig) {
    const parts = [
        `\`${field.fieldName}\` ${buildSqlColumnType(field)}`,
    ];

    if (field.notNull) {
        parts.push('NOT NULL');
    } else {
        parts.push('NULL');
    }

    if (field.primaryKey) {
        parts.push('PRIMARY KEY');
    }

    if (field.autoIncrement) {
        parts.push('AUTO_INCREMENT');
    }

    if (field.defaultValue) {
        parts.push(`DEFAULT '${escapeSqlValue(field.defaultValue)}'`);
    }

    if (field.comment) {
        parts.push(`COMMENT '${escapeSqlComment(field.comment)}'`);
    }

    return parts.join(' ');
}

/** 生成建表 SQL（仅表结构，不含 menu 相关语句） */
export function generateCreateTableSql(config: TableConfig) {
    const { tableName, tableComment, fieldList } = config;
    const validFields = fieldList.filter((item) => item.fieldName.trim());

    if (!tableName.trim() || !validFields.length) {
        return '';
    }

    const columns = validFields.map((field) => `  ${buildColumnSql(field)}`);
    const indexes = validFields
        .filter((field) => field.indexed && !field.primaryKey)
        .map((field) => `  KEY \`idx_${field.fieldName}\` (\`${field.fieldName}\`)`);

    const body = [...columns, ...indexes].join(',\n');
    const comment = tableComment ? ` COMMENT='${escapeSqlComment(tableComment)}'` : '';

    return [
        `CREATE TABLE \`${tableName}\` (`,
        body,
        `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4${comment};`,
    ].join('\n');
}

/** 获取参与 INSERT 的字段（排除自增主键） */
function getInsertFields(fieldList: TableFieldConfig[]) {
    return fieldList.filter((field) => field.fieldName.trim() && !field.autoIncrement);
}

/** 根据行索引生成字段 SQL 值 */
function buildFieldSqlValue(
    field: TableFieldConfig,
    rowIndex: number,
    mockPoolMap: Record<string, string[]>,
) {
    if (field.mockType && mockPoolMap[field.mockType]?.length) {
        const pool = mockPoolMap[field.mockType];
        const value = pool[rowIndex % pool.length];
        if (['int', 'bigint', 'decimal', 'tinyint'].includes(field.fieldType)) {
            const num = Number(value);
            return Number.isNaN(num) ? `'${escapeSqlValue(value)}'` : String(num);
        }
        if (field.fieldType === 'datetime') {
            return `'${escapeSqlValue(value)}'`;
        }
        return `'${escapeSqlValue(value)}'`;
    }

    if (field.defaultValue) {
        if (['int', 'bigint', 'decimal', 'tinyint'].includes(field.fieldType)) {
            const num = Number(field.defaultValue);
            return Number.isNaN(num) ? `'${escapeSqlValue(field.defaultValue)}'` : String(num);
        }
        return `'${escapeSqlValue(field.defaultValue)}'`;
    }

    if (field.primaryKey && ['int', 'bigint', 'tinyint'].includes(field.fieldType)) {
        return String(rowIndex + 1);
    }

    if (['int', 'bigint', 'decimal', 'tinyint'].includes(field.fieldType)) {
        return String(rowIndex + 1);
    }

    if (field.fieldType === 'datetime') {
        return `'2024-01-01 00:00:00'`;
    }

    return `'示例值${rowIndex + 1}'`;
}

/** 生成插入 SQL，支持多条并从模拟数据池取值 */
export function generateInsertSql(
    config: TableConfig,
    mockPoolMap: Record<string, string[]> = {},
    insertCount = 1,
) {
    const { tableName, fieldList } = config;
    const validFields = getInsertFields(fieldList);
    const count = Math.max(1, Math.min(insertCount, 500));

    if (!tableName.trim() || !validFields.length) {
        return '';
    }

    const columns = validFields.map((field) => `\`${field.fieldName}\``);
    const statements: string[] = [];

    for (let rowIndex = 0; rowIndex < count; rowIndex += 1) {
        const values = validFields.map((field) => buildFieldSqlValue(field, rowIndex, mockPoolMap));
        statements.push(`INSERT INTO \`${tableName}\` (${columns.join(', ')}) VALUES (${values.join(', ')});`);
    }

    return statements.join('\n');
}

/** 生成 TypeScript 接口 */
function generateTypescript(config: TableConfig) {
    const className = `I${toClassName(config.tableName)}`;
    const lines = [
        '/*',
        ` * @description ${config.tableComment || config.tableName}`,
        ' */',
        `export interface ${className} {`,
    ];

    config.fieldList
        .filter((field) => field.fieldName.trim())
        .forEach((field) => {
            const optional = field.notNull ? '' : '?';
            const comment = field.comment ? ` //${field.comment}` : '';
            lines.push(`  ${field.fieldName}${optional}: ${toTsType(field.fieldType)}${comment}`);
        });

    lines.push('}');
    return lines.join('\n');
}

/** 生成 Java 实体类 */
function generateJava(config: TableConfig) {
    const className = toClassName(config.tableName);
    const lines = ['import lombok.Data;', ''];

    if (config.fieldList.some((field) => field.fieldType === 'datetime')) {
        lines.unshift('import java.time.LocalDateTime;');
    }
    if (config.fieldList.some((field) => field.fieldType === 'decimal')) {
        lines.unshift('import java.math.BigDecimal;');
    }

    lines.push('@Data');
    if (config.tableComment) {
        lines.push(`/** ${config.tableComment} */`);
    }
    lines.push(`public class ${className} {`);

    config.fieldList
        .filter((field) => field.fieldName.trim())
        .forEach((field) => {
            const comment = field.comment ? ` //${field.comment}` : '';
            lines.push(`    private ${toJavaType(field.fieldType)} ${field.fieldName};${comment}`);
        });

    lines.push('}');
    return lines.join('\n');
}

/** 根据行索引生成字段展示值 */
function buildFieldDisplayValue(
    field: TableFieldConfig,
    rowIndex: number,
    mockPoolMap: Record<string, string[]>,
) {
    if (field.mockType && mockPoolMap[field.mockType]?.length) {
        const pool = mockPoolMap[field.mockType];
        const value = pool[rowIndex % pool.length];
        if (['int', 'bigint', 'decimal', 'tinyint'].includes(field.fieldType)) {
            const num = Number(value);
            return Number.isNaN(num) ? value : num;
        }
        return value;
    }

    if (field.defaultValue) {
        if (['int', 'bigint', 'decimal', 'tinyint'].includes(field.fieldType)) {
            const num = Number(field.defaultValue);
            return Number.isNaN(num) ? field.defaultValue : num;
        }
        return field.defaultValue;
    }

    if (field.primaryKey && ['int', 'bigint', 'tinyint'].includes(field.fieldType)) {
        return rowIndex + 1;
    }

    return ['int', 'bigint', 'decimal', 'tinyint'].includes(field.fieldType) ? rowIndex + 1 : `示例值${rowIndex + 1}`;
}

/** 生成 JSON 示例数据 */
function generateJson(
    config: TableConfig,
    mockPoolMap: Record<string, string[]> = {},
    insertCount = 1,
) {
    const validFields = getInsertFields(config.fieldList);
    const count = Math.max(1, Math.min(insertCount, 500));
    const rows = Array.from({ length: count }, (_, rowIndex) => {
        const row: Record<string, string | number> = {};
        validFields.forEach((field) => {
            row[field.fieldName] = buildFieldDisplayValue(field, rowIndex, mockPoolMap);
        });
        return row;
    });

    return JSON.stringify(rows, null, 2);
}

/** 生成 ProTable 配置项 */
function generateProTableConfig(config: TableConfig) {
    const options = config.fieldList
        .filter((field) => field.fieldName.trim())
        .map((field) => {
            const option: Record<string, unknown> = {
                key: field.fieldName,
                label: field.comment || field.fieldName,
            };

            if (field.hideInSearch) {
                option.hideInSearch = true;
            }
            if (field.hideInTable) {
                option.hideInTable = true;
            }
            if (field.advancedSearchType && field.advancedSearchType !== 'input') {
                option.type = field.advancedSearchType;
            }
            if (field.searchSlot) {
                option.searchSlot = true;
            }
            if (field.formSlot) {
                option.formSlot = true;
            }

            return option;
        });

    return JSON.stringify(options, null, 2);
}

/** 生成 ProForm 配置项 */
function generateProFormConfig(config: TableConfig) {
    const options = config.fieldList
        .filter((field) => field.fieldName.trim())
        .map((field) => {
            const option: Record<string, unknown> = {
                name: field.fieldName,
                label: field.comment || field.fieldName,
                type: field.advancedSearchType || 'input',
            };

            if (field.hideInForm) {
                option.hidden = true;
            }
            if (field.disabled) {
                option.disabled = true;
            }
            if (field.readOnly) {
                option.readOnly = true;
            }

            return option;
        });

    return JSON.stringify(options, null, 2);
}

/** 根据表格配置生成全部代码 */
export function generateTableCode(
    config: TableConfig,
    mockPoolMap: Record<string, string[]> = {},
    insertCount = 5,
): TableCodeGenerateResult {
    return {
        typescript: generateTypescript(config),
        java: generateJava(config),
        sqlCreate: generateCreateTableSql(config),
        sqlInsert: generateInsertSql(config, mockPoolMap, insertCount),
        json: generateJson(config, mockPoolMap, insertCount),
        proTable: generateProTableConfig(config),
        proForm: generateProFormConfig(config),
    };
}
