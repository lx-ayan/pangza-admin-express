import type { MockDataPool } from '@/types/api/mockData';

export interface MockDataCodeResult {
    typescript: string;
    java: string;
    sqlCreate: string;
    sqlInsert: string;
    json: string;
}

const DEFAULT_CLASS_NAME = 'TestTable';
const DEFAULT_TABLE_NAME = 'test_table';

/** 解析数据池内容为字符串数组 */
export function parsePoolValues(content?: string) {
    if (!content) {
        return [];
    }
    const text = content.trim();
    if (text.startsWith('[')) {
        try {
            const parsed = JSON.parse(text);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            return [];
        }
    }
    return text.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

/** SQL 字符串转义 */
function escapeSqlValue(value: string) {
    return value.replace(/'/g, "''");
}

/** 生成单条数据池映射的代码 */
export function generateMockDataCode(item: MockDataPool, options?: {
    className?: string;
    tableName?: string;
    tableDescription?: string;
}): MockDataCodeResult {
    const className = options?.className || DEFAULT_CLASS_NAME;
    const tableName = options?.tableName || DEFAULT_TABLE_NAME;
    const tableDescription = options?.tableDescription || '表格描述';
    const fieldName = item.name;
    const fieldDesc = (item.description || fieldName).replace(/'/g, '');
    const values = parsePoolValues(item.dataContent);

    const typescript = [
        '/*',
        ` * @description ${tableDescription}`,
        ' */',
        `interface ${className} {`,
        `  ${fieldName}?: string //${fieldDesc}`,
        '}',
    ].join('\n');

    const java = [
        'import lombok.Data;',
        '',
        '@Data',
        `public class ${className} {`,
        `    private String ${fieldName}; //${fieldDesc}`,
        '}',
    ].join('\n');

    const sqlCreate = [
        `CREATE TABLE ${tableName} (`,
        '`id` bigint(20) NOT NULL PRIMARY KEY AUTO_INCREMENT,',
        `\`${fieldName}\` varchar(255) NULL COMMENT '${fieldDesc}'`,
        ')',
    ].join('\n');

    const sqlInsert = values.length
        ? values.map((value, index) => {
            return `INSERT INTO ${tableName}(\`id\`,\`${fieldName}\`) VALUES (${index + 1},'${escapeSqlValue(value)}');`;
        }).join('\n')
        : `INSERT INTO ${tableName}(\`id\`,\`${fieldName}\`) VALUES (1,'示例值');`;

    const json = JSON.stringify(
        values.map((value) => ({ [fieldName]: value })),
        null,
        2,
    );

    return {
        typescript,
        java,
        sqlCreate,
        sqlInsert,
        json,
    };
}
