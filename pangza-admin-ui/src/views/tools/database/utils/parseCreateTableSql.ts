import type { TableFieldConfig } from '../types';

/** 反向导入解析结果 */
export interface ParseCreateTableSqlResult {
    tableName: string;
    tableComment: string;
    fieldList: Partial<TableFieldConfig>[];
}

/** 反向导入示例 SQL */
export const IMPORT_SQL_EXAMPLE = `CREATE TABLE \`sys_user\` (
  \`id\` varchar(64) NOT NULL COMMENT '主键',
  \`username\` varchar(100) NOT NULL COMMENT '用户名',
  \`age\` int(11) NULL DEFAULT '0' COMMENT '年龄',
  \`status\` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态',
  \`create_time\` datetime NULL COMMENT '创建时间',
  PRIMARY KEY (\`id\`),
  KEY \`idx_username\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';`;

/**
 * 按逗号拆分 SQL 片段，忽略括号、引号内的逗号
 */
function splitSqlParts(body: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    let quote: "'" | '"' | '`' | null = null;

    for (let i = 0; i < body.length; i += 1) {
        const char = body[i];
        const prev = body[i - 1];

        if (quote) {
            current += char;
            if (char === quote && prev !== '\\') {
                quote = null;
            }
            continue;
        }

        if (char === "'" || char === '"' || char === '`') {
            quote = char;
            current += char;
            continue;
        }

        if (char === '(') {
            depth += 1;
            current += char;
            continue;
        }

        if (char === ')') {
            depth = Math.max(0, depth - 1);
            current += char;
            continue;
        }

        if (char === ',' && depth === 0) {
            if (current.trim()) {
                parts.push(current.trim());
            }
            current = '';
            continue;
        }

        current += char;
    }

    if (current.trim()) {
        parts.push(current.trim());
    }

    return parts;
}

/**
 * 去掉字段/表名外层反引号或引号
 */
function unwrapIdentifier(value: string) {
    const trimmed = value.trim();
    if (
        (trimmed.startsWith('`') && trimmed.endsWith('`'))
        || (trimmed.startsWith('"') && trimmed.endsWith('"'))
        || (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1);
    }
    return trimmed;
}

/**
 * 解析 SQL 字符串字面量
 */
function unwrapSqlString(value: string) {
    const trimmed = value.trim();
    if (
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
        || (trimmed.startsWith('"') && trimmed.endsWith('"'))
    ) {
        return trimmed.slice(1, -1).replace(/''/g, "'");
    }
    return trimmed;
}

/**
 * 将 SQL 类型映射为库表设计支持的字段类型
 */
function mapSqlTypeToFieldType(rawType: string): string {
    const type = rawType.trim().toLowerCase();
    if (type.startsWith('varchar') || type.startsWith('char') || type.startsWith('nvarchar')) {
        return 'varchar';
    }
    if (type.startsWith('bigint')) {
        return 'bigint';
    }
    if (
        type.startsWith('int')
        || type.startsWith('integer')
        || type.startsWith('mediumint')
        || type.startsWith('smallint')
    ) {
        return 'int';
    }
    if (
        type.startsWith('decimal')
        || type.startsWith('numeric')
        || type.startsWith('float')
        || type.startsWith('double')
    ) {
        return 'decimal';
    }
    if (
        type.startsWith('datetime')
        || type.startsWith('timestamp')
        || type.startsWith('date')
        || type.startsWith('time')
    ) {
        return 'datetime';
    }
    if (
        type.startsWith('text')
        || type.startsWith('longtext')
        || type.startsWith('mediumtext')
        || type.startsWith('tinytext')
        || type.startsWith('blob')
        || type.startsWith('json')
    ) {
        return 'text';
    }
    if (type.startsWith('tinyint') || type.startsWith('bit') || type === 'boolean' || type === 'bool') {
        return 'tinyint';
    }
    return 'varchar';
}

/**
 * 根据字段类型推断高级搜索组件类型
 */
function inferSearchType(fieldType: string): string {
    if (fieldType === 'datetime') {
        return 'datePicker';
    }
    if (['int', 'bigint', 'decimal', 'tinyint'].includes(fieldType)) {
        return 'inputNumber';
    }
    if (fieldType === 'text') {
        return 'textarea';
    }
    return 'input';
}

/**
 * 从列定义中提取 COMMENT
 */
function extractColumnComment(definition: string) {
    const match = definition.match(/\bCOMMENT\s+('([^']*)'|"([^"]*)")/i);
    if (!match) {
        return '';
    }
    return unwrapSqlString(match[1]);
}

/**
 * 从列定义中提取 DEFAULT 值
 */
function extractDefaultValue(definition: string) {
    const match = definition.match(/\bDEFAULT\s+((?:'[^']*')|(?:"[^"]*")|(?:NULL)|(?:CURRENT_TIMESTAMP(?:\s*\(\s*\d*\s*\))?)|(?:[^\s,]+))/i);
    if (!match) {
        return '';
    }
    const raw = match[1].trim();
    if (/^NULL$/i.test(raw)) {
        return '';
    }
    if (/^CURRENT_TIMESTAMP/i.test(raw)) {
        return 'CURRENT_TIMESTAMP';
    }
    if (
        (raw.startsWith("'") && raw.endsWith("'"))
        || (raw.startsWith('"') && raw.endsWith('"'))
    ) {
        return unwrapSqlString(raw);
    }
    return raw;
}

/**
 * 从列定义中提取括号内标识符列表，如 PRIMARY KEY (`id`, `code`)
 */
function extractIdentifiersInParens(definition: string): string[] {
    const match = definition.match(/\((.+)\)\s*$/s);
    if (!match) {
        return [];
    }
    return splitSqlParts(match[1]).map(unwrapIdentifier).filter(Boolean);
}

/**
 * 判断是否为表级约束/索引定义（非普通字段）
 */
function isConstraintDefinition(definition: string) {
    return /^(PRIMARY\s+KEY|UNIQUE(?:\s+KEY|\s+INDEX)?|KEY|INDEX|CONSTRAINT|FOREIGN\s+KEY|FULLTEXT|SPATIAL)\b/i.test(definition);
}

/**
 * 解析单列字段定义
 */
function parseColumnDefinition(definition: string): Partial<TableFieldConfig> | null {
    const match = definition.match(/^(`[^`]+`|"[^"]+"|[a-zA-Z_][\w$]*)\s+([a-zA-Z]+(?:\s*\([^)]*\))?)/);
    if (!match) {
        return null;
    }

    const fieldName = unwrapIdentifier(match[1]);
    const fieldType = mapSqlTypeToFieldType(match[2]);

    return {
        fieldName,
        fieldType,
        comment: extractColumnComment(definition),
        defaultValue: extractDefaultValue(definition),
        primaryKey: /\bPRIMARY\s+KEY\b/i.test(definition),
        autoIncrement: /\bAUTO_INCREMENT\b/i.test(definition),
        notNull: /\bNOT\s+NULL\b/i.test(definition),
        indexed: false,
        advancedSearchType: inferSearchType(fieldType),
    };
}

/**
 * 解析 CREATE TABLE SQL，生成库表配置所需的表名、注释与字段信息
 */
export function parseCreateTableSql(sql: string): ParseCreateTableSqlResult {
    const text = sql.trim().replace(/^\uFEFF/, '');
    if (!text) {
        throw new Error('请输入 CREATE TABLE SQL');
    }

    const createMatch = text.match(
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"]?[\w$]+[`"]?\.)?([`"]?[\w$]+[`"]?)\s*\(/i,
    );
    if (!createMatch || createMatch.index == null) {
        throw new Error('未识别到 CREATE TABLE 语句，请检查 SQL');
    }

    const tableName = unwrapIdentifier(createMatch[1]);
    const startIndex = createMatch.index + createMatch[0].length;

    let depth = 1;
    let endIndex = -1;
    let quote: "'" | '"' | '`' | null = null;

    for (let i = startIndex; i < text.length; i += 1) {
        const char = text[i];
        const prev = text[i - 1];

        if (quote) {
            if (char === quote && prev !== '\\') {
                quote = null;
            }
            continue;
        }

        if (char === "'" || char === '"' || char === '`') {
            quote = char;
            continue;
        }

        if (char === '(') {
            depth += 1;
            continue;
        }

        if (char === ')') {
            depth -= 1;
            if (depth === 0) {
                endIndex = i;
                break;
            }
        }
    }

    if (endIndex < 0) {
        throw new Error('CREATE TABLE 括号不匹配，请检查 SQL');
    }

    const body = text.slice(startIndex, endIndex);
    const tail = text.slice(endIndex + 1);
    const tableCommentMatch = tail.match(/\bCOMMENT\s*=\s*('([^']*)'|"([^"]*)")/i);
    const tableComment = tableCommentMatch ? unwrapSqlString(tableCommentMatch[1]) : '';

    const parts = splitSqlParts(body);
    const fieldList: Partial<TableFieldConfig>[] = [];
    const primaryKeyFields = new Set<string>();
    const indexedFields = new Set<string>();

    parts.forEach((part) => {
        if (isConstraintDefinition(part)) {
            if (/^PRIMARY\s+KEY\b/i.test(part)) {
                extractIdentifiersInParens(part).forEach((name) => primaryKeyFields.add(name));
                return;
            }
            if (/^(UNIQUE(?:\s+KEY|\s+INDEX)?|KEY|INDEX|FULLTEXT|SPATIAL)\b/i.test(part)) {
                extractIdentifiersInParens(part).forEach((name) => indexedFields.add(name));
            }
            return;
        }

        const field = parseColumnDefinition(part);
        if (field?.fieldName) {
            fieldList.push(field);
        }
    });

    if (!fieldList.length) {
        throw new Error('未解析到任何字段，请确认 SQL 为有效的建表语句');
    }

    fieldList.forEach((field) => {
        if (!field.fieldName) {
            return;
        }
        if (primaryKeyFields.has(field.fieldName)) {
            field.primaryKey = true;
            field.notNull = true;
        }
        if (indexedFields.has(field.fieldName) && !field.primaryKey) {
            field.indexed = true;
        }
    });

    return {
        tableName,
        tableComment,
        fieldList,
    };
}
