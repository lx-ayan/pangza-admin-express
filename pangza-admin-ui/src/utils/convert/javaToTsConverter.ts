/**
 * Java 类字符串 → TypeScript 接口转换器
 * 支持：注解去除、字段修饰符、基础类型、嵌套类、泛型、数组、自引用
 */
class JavaToTsConverter {
  private baseTypeMap: Record<string, string> = {
    void: "void",
    boolean: "boolean",
    Boolean: "boolean | null",
    byte: "number",
    Byte: "number | null",
    short: "number",
    Short: "number | null",
    int: "number",
    Integer: "number | null",
    long: "number | bigint",
    Long: "number | bigint | null",
    float: "number",
    Float: "number | null",
    double: "number",
    Double: "number | null",
    char: "string",
    Character: "string | null",
    String: "string",
    Date: "Date | string",
    LocalDate: "Date | string",
    LocalDateTime: "Date | string",
    BigDecimal: "number | string",
  };

  // 集合类型映射（Java 集合 → TS 类型）
  private collectionMap: Record<string, (generic: string) => string> = {
    List: (g) => `${g}[]`,
    ArrayList: (g) => `${g}[]`,
    Set: (g) => `Set<${g}>`,
    HashSet: (g) => `Set<${g}>`,
    Map: (g) => {
      const [key, value] = g.split(",").map((s) => s.trim());
      return `Record<${key}, ${value}>`;
    },
    HashMap: (g) => {
      const [key, value] = g.split(",").map((s) => s.trim());
      return `Record<${key}, ${value}>`;
    },
  };

  /**
   * 主转换方法：传入 Java 类字符串，返回 TS 接口字符串
   * @param javaCode Java 类源码字符串
   * @returns TS 接口代码
   */
  convert(javaCode: string, enableUndefined: boolean = true): string {
    const cleanedCode = this.cleanJavaCode(javaCode);

    const { className, fields, nestedClasses } = this.parseJavaClass(cleanedCode);

    const tsInterface = this.generateTsInterface(className, fields, enableUndefined);

    const nestedTsInterfaces = nestedClasses
      .map((nestedCode) => this.convert(nestedCode))
      .join("\n\n");

    return [tsInterface, nestedTsInterfaces].filter(Boolean).join("\n\n");
  }

  /**
   * 预处理 Java 代码：去除注释、注解、多余空格
   */
  private cleanJavaCode(javaCode: string): string {
    return javaCode
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*/g, "") // 去除单行注释
      .replace(/@\w+(\([\s\S]*?\))?/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * 解析 Java 类字符串，提取类名、字段（支持修饰符/注解）、嵌套类
   */
  private parseJavaClass(javaCode: string): {
    className: string;
    fields: { type: string; name: string }[];
    nestedClasses: string[];
  } {
    const classMatch = javaCode.match(/(public|private|protected)?\s*class\s+(\w+)\s*\{([\s\S]*)\}/);
    if (!classMatch) throw new Error("无效的 Java 类格式");

    const className = classMatch[2];
    const classBody = classMatch[3].trim();
    const fields: { type: string; name: string }[] = [];
    const nestedClasses: string[] = [];

    const tokens = classBody.split(";").filter((t) => t.trim());

    for (const token of tokens) {
      const trimToken = token.trim();
      if (trimToken.match(/(public|private|protected|static)?\s*class\s+\w+/)) {
        nestedClasses.push(trimToken);
        continue;
      }

      const fieldMatch = trimToken.match(
        /^(?:public|private|protected|static)?\s*(\w+(\<[\s\S]*?\>)?(\[\])?)\s+(\w+)$/
      );
      if (fieldMatch) {
        const fieldType = fieldMatch[1].trim();
        const fieldName = fieldMatch[4].trim();
        fields.push({ type: fieldType, name: fieldName });
      }
    }

    return { className, fields, nestedClasses };
  }

  /**
   * 生成单个 TS 接口
   */
  private generateTsInterface(
    className: string,
    fields: { type: string; name: string }[],
    enableUndefined: boolean
  ): string {
    const tsFields = fields
      .map((field) => {
        const tsType = this.convertJavaType(field.type);
        return `  ${field.name}${enableUndefined ? '?' : ''}: ${tsType};`;
      })
      .join("\n");

    return `export interface ${className} {
${tsFields}
}`;
  }

  /**
   * 递归转换 Java 类型到 TS 类型
   */
  private convertJavaType(javaType: string): string {
    if (javaType.endsWith("[]")) {
      const elementType = javaType.slice(0, -2);
      return `${this.convertJavaType(elementType)}[]`;
    }

    if (javaType.includes("<") && javaType.endsWith(">")) {
      const [collectionName, genericPart] = javaType.split("<");
      const genericContent = genericPart.slice(0, -1).trim();
      const collectionKey = collectionName.trim();
      const collectionConverter = this.collectionMap[collectionKey];

      if (collectionConverter) {
        const convertedGeneric = this.convertJavaType(genericContent);
        return collectionConverter(convertedGeneric);
      }

      return `${collectionKey}<${this.convertJavaType(genericContent)}>`;
    }
    if (this.baseTypeMap.hasOwnProperty(javaType)) {
      return this.baseTypeMap[javaType];
    }

    return javaType;
  }
}

export default new JavaToTsConverter();