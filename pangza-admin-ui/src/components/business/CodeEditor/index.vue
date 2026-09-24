<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import {
    getSuggestionOptions,
    isSuggestionEnabled,
    normalizeLanguage,
    setupMonacoLanguages,
    type SupportedLanguage,
} from './language';
import { setupMonacoEnvironment } from './setupMonaco';

export type CodeEditorTheme = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

const props = withDefaults(defineProps<{
    /** 编辑器内容 */
    modelValue?: string;
    /** 语言类型，支持 javascript / typescript / python / rust / java / mysql */
    language?: SupportedLanguage | string;
    /** 编辑器主题，默认 VS Code 浅色风格 */
    theme?: CodeEditorTheme;
    /** 只读 */
    readOnly?: boolean;
    /** 禁用（不可编辑） */
    disabled?: boolean;
    /** 编辑器高度 */
    height?: string;
    /** 透传 monaco 配置 */
    options?: monaco.editor.IStandaloneEditorConstructionOptions;
}>(), {
    modelValue: '',
    language: 'javascript',
    theme: 'vs',
    readOnly: false,
    disabled: false,
    height: '320px',
    options: () => ({}),
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'change', value: string): void;
    (e: 'mount', editor: monaco.editor.IStandaloneCodeEditor): void;
}>();

const editorContainerRef = ref<HTMLElement>();
const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor>();
const isExternalUpdate = ref(false);

const isReadOnly = computed(() => props.readOnly || props.disabled);
const editorLanguage = computed(() => normalizeLanguage(props.language));
const suggestionEnabled = computed(() => isSuggestionEnabled(props.language));

const editorOptions = computed<monaco.editor.IStandaloneEditorConstructionOptions>(() => ({
    automaticLayout: true,
    fontSize: 14,
    lineNumbers: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    tabSize: 2,
    readOnly: isReadOnly.value,
    ...getSuggestionOptions(suggestionEnabled.value),
    ...props.options,
}));

function syncEditorValue(value: string) {
    if (!editorRef.value) {
        return;
    }
    const currentValue = editorRef.value.getValue();
    if (currentValue === value) {
        return;
    }
    isExternalUpdate.value = true;
    editorRef.value.setValue(value);
    isExternalUpdate.value = false;
}

function initEditor() {
    if (!editorContainerRef.value) {
        return;
    }

    setupMonacoEnvironment();
    setupMonacoLanguages();

    editorRef.value = monaco.editor.create(editorContainerRef.value, {
        value: props.modelValue,
        language: editorLanguage.value,
        theme: props.theme,
        ...editorOptions.value,
    });

    emit('mount', editorRef.value);

    editorRef.value.onDidChangeModelContent(() => {
        if (isExternalUpdate.value || !editorRef.value) {
            return;
        }
        const value = editorRef.value.getValue();
        emit('update:modelValue', value);
        emit('change', value);
    });
}

function updateEditorOptions() {
    editorRef.value?.updateOptions(editorOptions.value);
}

watch(() => props.modelValue, (value) => {
    syncEditorValue(value ?? '');
});

watch(() => props.language, (language) => {
    const model = editorRef.value?.getModel();
    if (model) {
        monaco.editor.setModelLanguage(model, normalizeLanguage(language));
    }
    updateEditorOptions();
});

watch(() => props.theme, (theme) => {
    monaco.editor.setTheme(theme);
});

watch(() => [props.readOnly, props.disabled, props.options], () => {
    updateEditorOptions();
}, { deep: true });

onMounted(() => {
    initEditor();
});

onBeforeUnmount(() => {
    editorRef.value?.dispose();
    editorRef.value = undefined;
});

defineExpose({
    getEditor: () => editorRef.value,
    focus: () => editorRef.value?.focus(),
    format: () => editorRef.value?.getAction('editor.action.formatDocument')?.run(),
});

defineOptions({
    name: 'CodeEditor',
});
</script>

<template>
    <div
        class="code-editor"
        :class="{ 'code-editor--disabled': disabled }"
        :style="{ height }"
    >
        <div ref="editorContainerRef" class="code-editor__container" />
    </div>
</template>

<style scoped lang="scss">
.code-editor {
    width: 100%;
    overflow: hidden;
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-default);
    background: var(--td-bg-color-container);

    &--disabled {
        opacity: 0.65;
        cursor: not-allowed;
    }

    &__container {
        width: 100%;
        height: 100%;
    }
}
</style>
