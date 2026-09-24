import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import CssWorker from 'monaco-editor/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/language/html/html.worker?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker?worker';

let initialized = false;

/** 配置 Monaco Editor Worker（Vite 环境） */
export function setupMonacoEnvironment() {
    if (initialized) {
        return;
    }
    initialized = true;

    self.MonacoEnvironment = {
        getWorker(_: unknown, label: string) {
            if (label === 'json') {
                return new JsonWorker();
            }
            if (label === 'css' || label === 'scss' || label === 'less') {
                return new CssWorker();
            }
            if (label === 'html' || label === 'handlebars' || label === 'razor') {
                return new HtmlWorker();
            }
            if (label === 'typescript' || label === 'javascript') {
                return new TsWorker();
            }
            return new EditorWorker();
        },
    };
}
