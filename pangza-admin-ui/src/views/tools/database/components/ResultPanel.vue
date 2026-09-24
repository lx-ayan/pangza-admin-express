<script setup lang="ts">
import CodeEditor from '@/components/business/CodeEditor/index.vue';
import useCopy from '@/hooks/core/useCopy';
import useThemeStore from '@/store/themeStore';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref } from 'vue';
import type { TableCodeGenerateResult, TableConfig } from '../types';
import { generateTableCode } from '../utils/generateTableCode';

const props = defineProps<{
    result: TableCodeGenerateResult | null;
    tableConfig: TableConfig;
    mockPoolMap: Record<string, string[]>;
}>();

const insertCount = defineModel<number>('insertCount', { default: 5 });

const activeTab = ref('typescript');
const proTab = ref('proTable');
const themeStore = useThemeStore();

const editorTheme = computed(() => themeStore.isDarkMode ? 'vs-dark' : 'vs');

/** 根据插入条数动态生成 SQL / JSON */
const dynamicResult = computed(() => {
    if (!props.result) {
        return null;
    }
    return generateTableCode(props.tableConfig, props.mockPoolMap, insertCount.value);
});

interface CodePanelItem {
    key: string;
    title: string;
    code: string;
    language: string;
    showInsertCount?: boolean;
}

const tabPanels = computed<Record<string, CodePanelItem[]>>(() => {
    if (!props.result || !dynamicResult.value) {
        return {};
    }

    const result = props.result;
    const current = dynamicResult.value;

    return {
        typescript: [
            { key: 'typescript', title: 'typescript 类型', code: result.typescript, language: 'typescript' },
        ],
        java: [
            { key: 'java', title: 'Java 类型', code: result.java, language: 'java' },
        ],
        sql: [
            { key: 'sql-create', title: 'Sql 创建表语句', code: result.sqlCreate, language: 'mysql' },
            {
                key: 'sql-insert',
                title: 'Sql 插入语句',
                code: current.sqlInsert,
                language: 'mysql',
                showInsertCount: true,
            },
        ],
        json: [
            { key: 'json', title: 'json 数据', code: current.json, language: 'json' },
        ],
    };
});

const currentPanels = computed(() => tabPanels.value[activeTab.value] || []);

const proPanels = computed<CodePanelItem[]>(() => {
    if (!props.result) {
        return [];
    }

    return [
        { key: 'proTable', title: 'ProTable 配置项', code: props.result.proTable, language: 'json' },
        { key: 'proForm', title: 'ProForm 配置项', code: props.result.proForm, language: 'json' },
    ];
});

const currentProPanel = computed(() => proPanels.value.find((item) => item.key === proTab.value));

/** 复制代码 */
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
</script>

<template>
    <div class="result-panel">
        <div class="result-panel__title">生成结果</div>

        <t-tabs v-model="activeTab" class="result-panel__tabs">
            <t-tab-panel value="typescript" label="typescript 类型" />
            <t-tab-panel value="java" label="Java 代码" />
            <t-tab-panel value="sql" label="SQL 代码" />
            <t-tab-panel value="json" label="JSON 代码" />
        </t-tabs>

        <div v-if="currentPanels.length" class="result-panel__content">
            <t-collapse default-expand-all borderless class="result-panel__collapse">
                <t-collapse-panel
                    v-for="panel in currentPanels"
                    :key="panel.key"
                    :value="panel.key"
                >
                    <template #header>
                        <div class="result-panel__panel-header">
                            <span>{{ panel.title }}</span>
                            <div class="result-panel__panel-actions">
                                <div
                                    v-if="panel.showInsertCount"
                                    class="result-panel__insert-count"
                                    @click.stop
                                >
                                    <span>插入条数</span>
                                    <t-input-number
                                        v-model="insertCount"
                                        :min="1"
                                        :max="500"
                                        theme="column"
                                        size="small"
                                    />
                                </div>
                                <t-button
                                    variant="text"
                                    size="small"
                                    @click.stop="handleCopy(panel.code)"
                                >
                                    <MyIcon name="Copy" :size="14" />
                                    复制
                                </t-button>
                            </div>
                        </div>
                    </template>

                    <CodeEditor
                        :model-value="panel.code"
                        :language="panel.language"
                        :theme="editorTheme"
                        read-only
                        :height="panel.showInsertCount ? '240px' : '180px'"
                    />
                </t-collapse-panel>
            </t-collapse>
        </div>

        <t-empty v-else description="点击一键生成查看结果" />

        <div class="result-panel__pro">
            <div class="result-panel__pro-title">ProComponent 生成结果</div>
            <t-tabs v-model="proTab" class="result-panel__tabs">
                <t-tab-panel value="proTable" label="ProTable 配置项" />
                <t-tab-panel value="proForm" label="ProForm 配置项" />
            </t-tabs>

            <t-collapse v-if="currentProPanel" default-expand-all borderless class="result-panel__collapse">
                <t-collapse-panel :value="currentProPanel.key">
                    <template #header>
                        <div class="result-panel__panel-header">
                            <span>{{ currentProPanel.title }}</span>
                            <t-button
                                variant="text"
                                size="small"
                                @click.stop="handleCopy(currentProPanel.code)"
                            >
                                <MyIcon name="Copy" :size="14" />
                                复制
                            </t-button>
                        </div>
                    </template>

                    <CodeEditor
                        :model-value="currentProPanel.code"
                        language="json"
                        :theme="editorTheme"
                        read-only
                        height="180px"
                    />
                </t-collapse-panel>
            </t-collapse>
        </div>
    </div>
</template>

<style scoped lang="scss">
.result-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 100%;
}

.result-panel__title,
.result-panel__pro-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.result-panel__tabs {
    :deep(.t-tabs__nav-item) {
        padding: 0 4px 12px;
    }
}

.result-panel__collapse {
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

.result-panel__panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
    font-size: 14px;
    color: var(--td-text-color-primary);
}

.result-panel__panel-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.result-panel__insert-count {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--td-text-color-secondary);
    font-size: 13px;
}

.result-panel__pro {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
</style>
