<script setup lang="ts">
import CodeEditor from '@/components/business/CodeEditor/index.vue';
import useCopy from '@/hooks/core/useCopy';
import useThemeStore from '@/store/themeStore';
import type { MockDataPool } from '@/types/api/mockData';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';
import { generateMockDataCode, type MockDataCodeResult } from '../../utils/generateMockDataCode';

const props = defineProps<{
    item: MockDataPool | null;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const activeTab = ref('typescript');
const codeResult = ref<MockDataCodeResult | null>(null);
const themeStore = useThemeStore();

const editorTheme = computed(() => themeStore.isDarkMode ? 'vs-dark' : 'vs');

interface CodePanelItem {
    key: string;
    title: string;
    code: string;
    language: string;
}

const tabPanels = computed<Record<string, CodePanelItem[]>>(() => {
    if (!codeResult.value) {
        return {};
    }

    const result = codeResult.value;

    return {
        typescript: [
            { key: 'typescript', title: 'typescript 类型', code: result.typescript, language: 'typescript' },
        ],
        java: [
            { key: 'java', title: 'Java 类型', code: result.java, language: 'java' },
        ],
        sql: [
            { key: 'sql-create', title: 'Sql 创建表语句', code: result.sqlCreate, language: 'mysql' },
            { key: 'sql-insert', title: 'Sql 插入语句', code: result.sqlInsert, language: 'mysql' },
        ],
        json: [
            { key: 'json', title: 'json 数据', code: result.json, language: 'json' },
        ],
    };
});

const currentPanels = computed(() => tabPanels.value[activeTab.value] || []);

function buildCodeResult() {
    if (!props.item) {
        codeResult.value = null;
        return;
    }
    codeResult.value = generateMockDataCode(props.item);
}

function handleCopy(code: string) {
    if (!code) {
        return;
    }
    useCopy(code).then(() => {
        MessagePlugin.success('复制成功');
    }).catch((error) => {
        MessagePlugin.error(String(error));
    });
}

watch(visible, (value) => {
    if (value) {
        activeTab.value = 'typescript';
        buildCodeResult();
    }
});

watch(() => props.item, () => {
    if (visible.value) {
        buildCodeResult();
    }
});
</script>

<template>
    <t-drawer
        v-model:visible="visible"
        header="代码生成"
        size="920px"
        :footer="false"
        destroy-on-close
        class="generate-code-modal"
    >
        <div class="generate-code-modal__body">
            <div class="generate-code-modal__title">生成结果</div>

            <t-tabs v-model="activeTab" class="generate-code-modal__tabs">
                <t-tab-panel value="typescript" label="typescript 类型" />
                <t-tab-panel value="java" label="Java 代码" />
                <t-tab-panel value="sql" label="SQL 代码" />
                <t-tab-panel value="json" label="JSON 代码" />
            </t-tabs>

            <t-collapse
                v-if="currentPanels.length"
                default-expand-all
                borderless
                class="generate-code-modal__collapse"
            >
                <t-collapse-panel
                    v-for="panel in currentPanels"
                    :key="panel.key"
                    :value="panel.key"
                >
                    <template #header>
                        <div class="generate-code-modal__panel-header">
                            <span>{{ panel.title }}</span>
                            <t-button
                                variant="text"
                                size="small"
                                class="generate-code-modal__copy"
                                @click.stop="handleCopy(panel.code)"
                            >
                                <MyIcon name="Copy" :size="14" />
                                复制
                            </t-button>
                        </div>
                    </template>

                    <CodeEditor
                        :model-value="panel.code"
                        :language="panel.language"
                        :theme="editorTheme"
                        read-only
                        height="220px"
                    />
                </t-collapse-panel>
            </t-collapse>
        </div>
    </t-drawer>
</template>

<style scoped lang="scss">
.generate-code-modal__body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 420px;
}

.generate-code-modal__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
}

.generate-code-modal__tabs {
    :deep(.t-tabs__nav-item) {
        padding: 0 4px 12px;
    }
}

.generate-code-modal__collapse {
    :deep(.t-collapse-panel__wrapper) {
        border: 1px solid var(--td-component-border);
        border-radius: var(--td-radius-large);
        overflow: hidden;
        background: var(--td-bg-color-container);
    }

    :deep(.t-collapse-panel + .t-collapse-panel) {
        margin-top: 12px;
    }

    :deep(.t-collapse-panel__header) {
        padding: 12px 16px;
        background: var(--td-bg-color-container);
    }

    :deep(.t-collapse-panel__body) {
        padding: 0 16px 16px;
        background: var(--td-bg-color-container);
    }
}

.generate-code-modal__panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
    font-size: 14px;
    color: var(--td-text-color-primary);
}

.generate-code-modal__copy {
    flex-shrink: 0;
}
</style>
