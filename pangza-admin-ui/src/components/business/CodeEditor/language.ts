import {
    languages,
    typescript,
    type editor,
    type IDisposable,
    type IRange,
} from 'monaco-editor';

export const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'python', 'rust', 'java', 'mysql'] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

type EditorOptions = editor.IEditorOptions & editor.IGlobalEditorOptions;

const LANGUAGE_ALIASES: Record<string, SupportedLanguage> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    sql: 'mysql',
};

const PYTHON_KEYWORDS = [
    'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
    'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
    'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
    'return', 'try', 'while', 'with', 'yield',
];

const PYTHON_BUILTINS = [
    'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple',
    'open', 'isinstance', 'type', 'super', 'enumerate', 'zip', 'map', 'filter',
];

const PYTHON_SNIPPETS: Array<{ label: string; insertText: string }> = [
    { label: 'def', insertText: 'def ${1:name}(${2:params}):\n\t${3:pass}' },
    { label: 'class', insertText: 'class ${1:ClassName}:\n\tdef __init__(self${2:, args}):\n\t\t${3:pass}' },
    { label: 'if', insertText: 'if ${1:condition}:\n\t${2:pass}' },
    { label: 'for', insertText: 'for ${1:item} in ${2:iterable}:\n\t${3:pass}' },
    { label: 'try', insertText: 'try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:pass}' },
];

const RUST_KEYWORDS = [
    'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum',
    'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod',
    'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'trait',
    'true', 'type', 'unsafe', 'use', 'where', 'while',
];

const RUST_TYPES = [
    'String', 'str', 'i8', 'i16', 'i32', 'i64', 'u8', 'u16', 'u32', 'u64', 'usize', 'isize',
    'f32', 'f64', 'bool', 'char', 'Vec', 'Option', 'Result', 'Some', 'None', 'Ok', 'Err',
];

const RUST_SNIPPETS: Array<{ label: string; insertText: string }> = [
    { label: 'fn', insertText: 'fn ${1:name}(${2:params}) ${3:-> ${4:ReturnType}} {\n\t${5:// todo}\n}' },
    { label: 'struct', insertText: 'struct ${1:Name} {\n\t${2:field}: ${3:Type},\n}' },
    { label: 'impl', insertText: 'impl ${1:Type} {\n\t${2:// methods}\n}' },
    { label: 'if', insertText: 'if ${1:condition} {\n\t${2:// todo}\n}' },
    { label: 'match', insertText: 'match ${1:value} {\n\t${2:pattern} => ${3:result},\n}' },
];

const JAVA_KEYWORDS = [
    'abstract', 'assert', 'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'do',
    'else', 'enum', 'extends', 'final', 'finally', 'for', 'if', 'implements', 'import', 'instanceof',
    'interface', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'static',
    'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try',
    'volatile', 'while',
];

const JAVA_TYPES = [
    'boolean', 'byte', 'char', 'double', 'float', 'int', 'long', 'short', 'void',
    'String', 'Integer', 'Long', 'Boolean', 'Double', 'Float', 'Object', 'List', 'Map', 'Set',
    'Optional', 'Stream', 'var',
];

const JAVA_SNIPPETS: Array<{ label: string; insertText: string }> = [
    { label: 'class', insertText: 'public class ${1:ClassName} {\n\t${2:// code}\n}' },
    { label: 'main', insertText: 'public static void main(String[] args) {\n\t${1:// code}\n}' },
    { label: 'if', insertText: 'if (${1:condition}) {\n\t${2:// code}\n}' },
    { label: 'for', insertText: 'for (${1:int i = 0}; ${2:i < length}; ${3:i++}) {\n\t${4:// code}\n}' },
    { label: 'foreach', insertText: 'for (${1:Type} ${2:item} : ${3:collection}) {\n\t${4:// code}\n}' },
    { label: 'try', insertText: 'try {\n\t${1:// code}\n} catch (${2:Exception} e) {\n\t${3:e.printStackTrace();}\n}' },
    { label: 'sout', insertText: 'System.out.println(${1:value});' },
];

const MYSQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
    'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES', 'UPDATE',
    'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE',
    'NOT NULL', 'NULL', 'DEFAULT', 'AUTO_INCREMENT', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
    'AS', 'DISTINCT', 'UNION', 'UNION ALL', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
    'DATABASE', 'SCHEMA', 'VIEW', 'TRIGGER', 'PROCEDURE', 'FUNCTION', 'ENGINE', 'CHARSET', 'COMMENT',
    'ASC', 'DESC', 'IS', 'TRUE', 'FALSE', 'WITH', 'RECURSIVE',
];

const MYSQL_FUNCTIONS = [
    'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'NOW', 'CURDATE', 'CURTIME', 'DATE_FORMAT', 'IFNULL', 'NULLIF',
    'CONCAT', 'SUBSTRING', 'LENGTH', 'UPPER', 'LOWER', 'ROUND', 'CAST', 'COALESCE', 'IF', 'GROUP_CONCAT',
    'DATE_ADD', 'DATE_SUB', 'DATEDIFF', 'YEAR', 'MONTH', 'DAY', 'FIND_IN_SET', 'REPLACE', 'TRIM',
];

const MYSQL_SNIPPETS: Array<{ label: string; insertText: string }> = [
    { label: 'select', insertText: 'SELECT ${1:*}\nFROM ${2:table}\nWHERE ${3:condition};' },
    { label: 'insert', insertText: 'INSERT INTO ${1:table} (${2:columns})\nVALUES (${3:values});' },
    { label: 'update', insertText: 'UPDATE ${1:table}\nSET ${2:column} = ${3:value}\nWHERE ${4:condition};' },
    { label: 'delete', insertText: 'DELETE FROM ${1:table}\nWHERE ${2:condition};' },
    { label: 'create table', insertText: 'CREATE TABLE ${1:table_name} (\n\t${2:id} INT PRIMARY KEY AUTO_INCREMENT,\n\t${3:created_at} DATETIME DEFAULT CURRENT_TIMESTAMP\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;' },
    { label: 'left join', insertText: 'LEFT JOIN ${1:table} ON ${2:left.id} = ${3:right.id}' },
];

let initialized = false;
const disposables: IDisposable[] = [];

export function normalizeLanguage(language?: string) {
    const lang = (language || 'plaintext').toLowerCase();
    return LANGUAGE_ALIASES[lang] || lang;
}

export function isSuggestionEnabled(language?: string) {
    const normalized = normalizeLanguage(language);
    return SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage);
}

export function getSuggestionOptions(enabled: boolean): EditorOptions {
    if (enabled) {
        return {
            quickSuggestions: { other: true, comments: false, strings: true },
            wordBasedSuggestions: 'currentDocument',
            suggestOnTriggerCharacters: true,
            parameterHints: { enabled: true },
            hover: { enabled: 'on' },
            inlineSuggest: { enabled: true },
        };
    }

    return {
        quickSuggestions: false,
        wordBasedSuggestions: 'off',
        suggestOnTriggerCharacters: false,
        parameterHints: { enabled: false },
        hover: { enabled: 'on' },
        inlineSuggest: { enabled: false },
    };
}

function createKeywordSuggestions(
    words: string[],
    range: IRange,
    kind: languages.CompletionItemKind = languages.CompletionItemKind.Keyword,
): languages.CompletionItem[] {
    return words.map((word) => ({
        label: word,
        kind,
        insertText: word,
        range,
    }));
}

function createSnippetSuggestions(
    snippets: Array<{ label: string; insertText: string }>,
    range: IRange,
): languages.CompletionItem[] {
    return snippets.map((snippet) => ({
        label: snippet.label,
        kind: languages.CompletionItemKind.Snippet,
        insertText: snippet.insertText,
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
    }));
}

function registerKeywordProvider(
    languageId: string,
    getSuggestions: (range: IRange) => languages.CompletionItem[],
    triggerCharacters: string[] = ['.', ' '],
) {
    disposables.push(
        languages.registerCompletionItemProvider(languageId, {
            triggerCharacters,
            provideCompletionItems(model, position) {
                const word = model.getWordUntilPosition(position);
                const range: IRange = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                return {
                    suggestions: getSuggestions(range),
                };
            },
        }),
    );
}

function setupTypeScriptLanguage() {
    const compilerOptions: typescript.CompilerOptions = {
        target: typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: typescript.ModuleResolutionKind.NodeJs,
        module: typescript.ModuleKind.ESNext,
        noEmit: true,
        esModuleInterop: true,
        jsx: typescript.JsxEmit.React,
        allowJs: true,
    };

    typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
    typescript.javascriptDefaults.setCompilerOptions(compilerOptions);
    typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
    });
    typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
    });
}

function setupPythonLanguage() {
    registerKeywordProvider('python', (range) => [
        ...createKeywordSuggestions(PYTHON_KEYWORDS, range),
        ...createKeywordSuggestions(PYTHON_BUILTINS, range, languages.CompletionItemKind.Function),
        ...createSnippetSuggestions(PYTHON_SNIPPETS, range),
    ]);
}

function setupRustLanguage() {
    registerKeywordProvider('rust', (range) => [
        ...createKeywordSuggestions(RUST_KEYWORDS, range),
        ...createKeywordSuggestions(RUST_TYPES, range, languages.CompletionItemKind.Class),
        ...createSnippetSuggestions(RUST_SNIPPETS, range),
    ]);
}

function setupJavaLanguage() {
    registerKeywordProvider('java', (range) => [
        ...createKeywordSuggestions(JAVA_KEYWORDS, range),
        ...createKeywordSuggestions(JAVA_TYPES, range, languages.CompletionItemKind.Class),
        ...createSnippetSuggestions(JAVA_SNIPPETS, range),
    ]);
}

function setupMysqlLanguage() {
    registerKeywordProvider('mysql', (range) => [
        ...createKeywordSuggestions(MYSQL_KEYWORDS, range),
        ...createKeywordSuggestions(MYSQL_FUNCTIONS, range, languages.CompletionItemKind.Function),
        ...createSnippetSuggestions(MYSQL_SNIPPETS, range),
    ], ['.', ' ', ',']);
}

export function setupMonacoLanguages() {
    if (initialized) {
        return;
    }

    initialized = true;
    setupTypeScriptLanguage();
    setupPythonLanguage();
    setupRustLanguage();
    setupJavaLanguage();
    setupMysqlLanguage();
}

export function disposeMonacoLanguages() {
    disposables.splice(0).forEach((item) => item.dispose());
    initialized = false;
}
