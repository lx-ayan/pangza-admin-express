/**
 * JSON 转 TypeScript/Java 类型定义工具类
 * 特性：
 * 1. 面向对象设计，支持复用和扩展
 * 2. TS 直接导出接口（无 Root 根包装）
 * 3. Java 直接生成可复用 Bean 类（无继承包装）
 * 4. 兼容简单键名（如 admin: 123）和复杂嵌套结构
 */
class JsonToTypesConverter {
    // 类型ID计数器（避免嵌套类型命名冲突）
    private typeId = 0;

    /**
     * 核心转换方法
     * @param jsonStr 合法的 JSON 字符串
     * @returns 包含 TS 接口和 Java 类的对象
     * @throws 当 JSON 格式非法时抛出错误
     */
    convert(jsonStr: string, isUndefined?: boolean): { ts: string; java: string } {
        // 解析 JSON 并校验根类型（必须是对象，符合 { key: value } 格式）
        let json: unknown;
        try {
            json = JSON.parse(jsonStr);
        } catch (error) {
            throw new Error(`JSON 解析失败: ${(error as Error).message}`);
        }

        if (typeof json !== 'object' || json === null || Array.isArray(json)) {
            throw new Error('仅支持根节点为对象类型的 JSON（如 { "key": "value" }）');
        }

        // 重置计数器（支持多次转换）
        this.typeId = 0;

        // 生成 TS 代码
        const tsResult = this.generateTsTypes(json as Record<string, unknown>, isUndefined);
        // 生成 Java 代码
        const javaResult = this.generateJavaClasses(json as Record<string, unknown>);

        return { ts: tsResult, java: javaResult };
    }

    /**
     * 生成 TypeScript 接口（直接导出，无根包装）
     */
    private generateTsTypes(rootObj: Record<string, unknown>, isUndefined?: boolean): string {
        const interfaces: Record<string, string> = {};
        const rootProperties: string[] = [];

        for (const [key, value] of Object.entries(rootObj)) {
            const propType = this.processTsValue(value, this.getNextTypeId(key), interfaces);
            rootProperties.push(`  ${key}${isUndefined ? '?' : ''}: ${propType}; `);
        }

        const rootInterface = `export interface JsonToTsResult { \n${rootProperties.join('\n')} \n}`;

        const allInterfaces = [rootInterface, ...Object.values(interfaces)].join('\n\n');
        return this.formatTsCode(allInterfaces);
    }

    /**
     * 递归处理 TS 类型值
     */
    private processTsValue(
        value: unknown,
        typeName: string,
        interfaces: Record<string, string>
    ): string {
        if (value === null) return 'null';

        const type = typeof value;

        if (type === 'string') return 'string';
        if (type === 'number') return 'number';
        if (type === 'boolean') return 'boolean';

        if (Array.isArray(value)) {
            if (value.length === 0) return 'unknown[]';
            const nonNullItem = value.find(item => item !== null);
            const itemType = nonNullItem
                ? this.processTsValue(nonNullItem, `${typeName} Item`, interfaces)
                : 'null';
            const hasMixedTypes = value.some(
                item => item !== null && this.processTsValue(item, '', interfaces) !== itemType
            );
            return hasMixedTypes ? `(${itemType} | null)[]` : `${itemType} []`;
        }

        if (type === 'object') {
            if (interfaces[typeName]) return typeName;

            const obj = value as Record<string, unknown>;
            const properties: string[] = [];
            for (const [key, val] of Object.entries(obj)) {
                const propType = this.processTsValue(val, this.getNextTypeId(`${typeName}${key} `), interfaces);
                properties.push(`  ${key}: ${propType}; `);
            }

            const interfaceStr = `export interface ${typeName} { \n${properties.join('\n')} \n } `;
            interfaces[typeName] = interfaceStr;
            return typeName;
        }

        return 'unknown';
    }

    /**
     * 生成 Java Bean 类（直接生成，无继承包装）
     */
    private generateJavaClasses(rootObj: Record<string, unknown>): string {
        const classes: Record<string, string> = {};

        const rootClassName = 'JsonToJavaResult';
        this.processJavaValue(rootObj, rootClassName, classes);

        const importStr = `import java.util.List; \nimport java.util.ArrayList; \n`;
        const allClasses = Object.values(classes).join('\n\n');
        return `${importStr} \n${allClasses} `;
    }

    /**
     * 递归处理 Java 类型值
     */
    private processJavaValue(
        value: unknown,
        className: string,
        classes: Record<string, string>
    ): string {
        if (value === null) return 'Object';

        const type = typeof value;

        if (type === 'string') return 'String';
        if (type === 'number') {
            return Number.isInteger(value as number) ? 'Integer' : 'Double';
        }
        if (type === 'boolean') return 'Boolean';

        if (Array.isArray(value)) {
            if (value.length === 0) return 'List<Object>';
            const nonNullItem = value.find(item => item !== null);
            const itemType = nonNullItem
                ? this.processJavaValue(nonNullItem, `${className} Item`, classes)
                : 'Object';
            const hasMixedTypes = value.some(
                item => item !== null && this.processJavaValue(item, '', classes) !== itemType
            );
            return hasMixedTypes ? 'List<Object>' : `List < ${itemType}> `;
        }

        if (type === 'object') {
            if (classes[className]) return className;

            const obj = value as Record<string, unknown>;
            const fields: string[] = [];
            const getters: string[] = [];
            const setters: string[] = [];

            for (const [key, val] of Object.entries(obj)) {
                const fieldType = this.processJavaValue(val, this.getNextTypeId(`${className}${key} `), classes);
                const fieldName = this.normalizeFieldName(key); // 标准化字段名（兼容简单键名）

                fields.push(`  private ${fieldType} ${fieldName}; `);

                const getterName = `get${this.capitalizeFirstLetter(fieldName)} `;
                getters.push(
                    `  public ${fieldType} ${getterName} () {
    `,
                    `    return this.${fieldName}; `,
                    `  }`
                );

                const setterName = `set${this.capitalizeFirstLetter(fieldName)} `;
                setters.push(
                    `  public void ${setterName} (${fieldType} ${fieldName}) {
    `,
                    `    this.${fieldName} = ${fieldName}; `,
                    `  } `
                );
            }

            const classStr = [
                `public class $ { className } {
    `,
                '',
                ...fields,
                '',
                `  // 默认构造函数`,
                `  public ${className}() {}`,
                '',
                ...getters,
                '',
                ...setters,
                '}'
            ].join('\n');

            classes[className] = classStr;
            return className;
        }

        return 'Object';
    }

    /**
     * 获取下一个唯一类型ID（基于键名生成有意义的类型名）
     */
    private getNextTypeId(prefix: string): string {
        this.typeId++;
        const cleanPrefix = prefix.replace(/[^a-zA-Z0-9]/g, ''); // 过滤非法字符
        return `${this.capitalizeFirstLetter(cleanPrefix)}Type${this.typeId}`;
    }

    /**
     * 首字母大写
     */
    private capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * 标准化字段名（兼容简单键名如 admin、user_name 转为驼峰）
     */
    private normalizeFieldName(str: string): string {
        // 下划线转驼峰 + 确保首字母小写
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            .replace(/^[A-Z]/, (firstLetter) => firstLetter.toLowerCase());
    }

    /**
     * 格式化 TS 代码（简单美化）
     */
    private formatTsCode(code: string): string {
        return code.replace(/\n{3,}/g, '\n\n');
    }
}

export default new JsonToTypesConverter();
