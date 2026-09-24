<script setup lang="ts">
import {
    createTableConfig,
    deleteTableConfig,
    getTableConfigList,
    updateTableConfig,
} from '@/api/tableConfig';
import { getMockDataPoolList } from '@/api/mockData';
import storageUtil from '@/utils/core/store';
import { parsePoolValues } from '@/views/tools/data/utils/generateMockDataCode';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import ImportConfigModal from './components/ImportConfigModal.vue';
import ImportSqlModal from './components/ImportSqlModal.vue';
import ImportTableModal from './components/ImportTableModal.vue';
import LazyConfigModal from './components/LazyConfigModal.vue';
import ResultPanel from './components/ResultPanel.vue';
import {
    BASE_ENTITY_FIELD_PRESETS,
    createDefaultField,
    createDefaultTableConfig,
    DRAFT_STORAGE_KEY,
    FIELD_TYPE_OPTIONS,
    SEARCH_TYPE_OPTIONS,
} from './constants';
import type { SavedTableConfig, TableCodeGenerateResult, TableConfig, TableFieldConfig } from './types';
import { generateTableCode } from './utils/generateTableCode';
import { parseCreateTableSql } from './utils/parseCreateTableSql';
import { toSavedTableConfig, toTableConfigPayload } from './utils/tableConfigMapper';

const tableConfig = ref<TableConfig>(createDefaultTableConfig());
const currentConfigId = ref<Nullable<string>>(null);
const expandedFields = ref<string[]>([]);
const generateResult = ref<TableCodeGenerateResult | null>(null);
const mockPoolOptions = ref<LabelOptionList>([]);
const mockPoolMap = ref<Record<string, string[]>>({});
const savedTables = ref<SavedTableConfig[]>([]);
const importTableKeyword = ref('');
const saving = ref(false);

const lazyConfigVisible = ref(false);
const importConfigVisible = ref(false);
const importSqlVisible = ref(false);
const importTableVisible = ref(false);
const insertCount = ref(5);

const fieldCount = computed(() => tableConfig.value.fieldList.length);

const filteredSavedTables = computed(() => {
    const keyword = importTableKeyword.value.trim().toLowerCase();
    if (!keyword) {
        return savedTables.value;
    }
    return savedTables.value.filter((item) => {
        return item.tableName.toLowerCase().includes(keyword)
            || (item.tableComment || '').toLowerCase().includes(keyword);
    });
});

/** 加载模拟数据池选项 */
async function loadMockPools() {
    try {
        const pools = await getMockDataPoolList();
        mockPoolOptions.value = pools.map((item) => ({
            label: item.description || item.name,
            value: item.name,
        }));
        mockPoolMap.value = pools.reduce<Record<string, string[]>>((result, item) => {
            result[item.name] = parsePoolValues(item.dataContent);
            return result;
        }, {});
    } catch {
        mockPoolOptions.value = [];
        mockPoolMap.value = {};
    }
}

/** 加载本地草稿 */
function loadDraft() {
    const draft = storageUtil.get<TableConfig>(DRAFT_STORAGE_KEY);
    if (draft?.fieldList?.length) {
        tableConfig.value = draft;
        expandedFields.value = [draft.fieldList[0].id];
    } else {
        expandedFields.value = [tableConfig.value.fieldList[0].id];
    }
}

/** 加载已保存的表配置 */
async function loadSavedTables() {
    try {
        const list = await getTableConfigList();
        savedTables.value = list.map(toSavedTableConfig);
    } catch {
        savedTables.value = [];
    }
}

/** 保存配置到后端 */
async function handleSaveDraft() {
    if (!tableConfig.value.tableName.trim()) {
        MessagePlugin.warning('请输入表名');
        return;
    }
    if (!tableConfig.value.fieldList.some((field) => field.fieldName.trim())) {
        MessagePlugin.warning('请至少配置一个字段');
        return;
    }

    storageUtil.set(DRAFT_STORAGE_KEY, tableConfig.value);
    saving.value = true;

    try {
        const payload = toTableConfigPayload(tableConfig.value);
        if (currentConfigId.value) {
            await updateTableConfig({
                id: currentConfigId.value,
                ...payload,
            });
        } else {
            const existing = savedTables.value.find((item) => item.tableName === tableConfig.value.tableName);
            if (existing) {
                await updateTableConfig({
                    id: existing.id,
                    ...payload,
                });
                currentConfigId.value = existing.id;
            } else {
                await createTableConfig(payload);
            }
        }
        await loadSavedTables();
        const matched = savedTables.value.find((item) => item.tableName === tableConfig.value.tableName);
        if (matched) {
            currentConfigId.value = matched.id;
        }
        MessagePlugin.success('保存成功');
    } catch (error) {
        MessagePlugin.error(String(error));
    } finally {
        saving.value = false;
    }
}

/** 重置表格配置 */
function handleReset() {
    storageUtil.remove(DRAFT_STORAGE_KEY);
    tableConfig.value = createDefaultTableConfig();
    currentConfigId.value = null;
    generateResult.value = null;
    insertCount.value = 5;
    expandedFields.value = [tableConfig.value.fieldList[0].id];
    MessagePlugin.success('已重置');
}

/** 一键生成代码 */
function handleGenerate() {
    if (!tableConfig.value.tableName.trim()) {
        MessagePlugin.warning('请输入表名');
        return;
    }
    if (!tableConfig.value.fieldList.some((field) => field.fieldName.trim())) {
        MessagePlugin.warning('请至少配置一个字段');
        return;
    }

    generateResult.value = generateTableCode(tableConfig.value, mockPoolMap.value, insertCount.value);
    MessagePlugin.success('生成成功');
}

/** 切换字段展开状态 */
function toggleFieldExpand(id: string) {
    if (expandedFields.value.includes(id)) {
        expandedFields.value = expandedFields.value.filter((item) => item !== id);
        return;
    }
    expandedFields.value = [...expandedFields.value, id];
}

/** 判断字段是否展开 */
function isFieldExpanded(id: string) {
    return expandedFields.value.includes(id);
}

/** 导入基础审计字段 */
function handleImportBaseFields() {
    const existingNames = new Set(tableConfig.value.fieldList.map((field) => field.fieldName));
    const presets = BASE_ENTITY_FIELD_PRESETS.filter((item) => !existingNames.has(item.fieldName!));

    if (!presets.length) {
        MessagePlugin.warning('基础字段已全部存在');
        return;
    }

    const fields = presets.map((preset) => createDefaultField(preset));
    tableConfig.value.fieldList.push(...fields);
    expandedFields.value = [...expandedFields.value, fields[fields.length - 1].id];
    MessagePlugin.success(`已导入 ${fields.length} 个基础字段`);
}

/** 添加字段 */
function handleAddField() {
    const field = createDefaultField({
        fieldName: `field_${tableConfig.value.fieldList.length + 1}`,
    });
    tableConfig.value.fieldList.push(field);
    expandedFields.value = [field.id];
}

/** 删除字段 */
function handleDeleteField(id: string) {
    if (tableConfig.value.fieldList.length <= 1) {
        MessagePlugin.warning('至少保留一个字段');
        return;
    }
    tableConfig.value.fieldList = tableConfig.value.fieldList.filter((field) => field.id !== id);
    expandedFields.value = expandedFields.value.filter((item) => item !== id);
}

/** 应用懒人配置 */
function handleLazyConfigConfirm(value: string) {
    const names = value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
    if (!names.length) {
        MessagePlugin.warning('请输入有效字段');
        return;
    }

    tableConfig.value.fieldList = names.map((fieldName) => createDefaultField({
        fieldName,
        comment: fieldName,
        fieldType: 'varchar',
        primaryKey: false,
        autoIncrement: false,
    }));
    currentConfigId.value = null;
    expandedFields.value = [tableConfig.value.fieldList[0].id];
    MessagePlugin.success('懒人配置已应用');
}

/** 规范化导入字段 */
function normalizeField(field: Partial<TableFieldConfig>, index: number): TableFieldConfig {
    return createDefaultField({
        fieldName: field.fieldName || `field_${index + 1}`,
        fieldType: field.fieldType || 'varchar',
        comment: field.comment || field.fieldName || '',
        mockType: field.mockType || '',
        defaultValue: field.defaultValue || '',
        primaryKey: Boolean(field.primaryKey),
        autoIncrement: Boolean(field.autoIncrement),
        notNull: Boolean(field.notNull),
        indexed: Boolean(field.indexed),
        mybatis: field.mybatis ?? true,
        swagger: field.swagger ?? true,
        hideInSearch: Boolean(field.hideInSearch),
        hideInTable: Boolean(field.hideInTable),
        formSlot: Boolean(field.formSlot),
        searchSlot: Boolean(field.searchSlot),
        advancedSearchType: field.advancedSearchType || 'input',
        hideInForm: Boolean(field.hideInForm),
        disabled: Boolean(field.disabled),
        readOnly: Boolean(field.readOnly),
    });
}

/** 应用 JSON 导入配置 */
function handleImportConfigConfirm(value: string) {
    try {
        const parsed = JSON.parse(value) as Partial<TableConfig> & { fieldList?: Partial<TableFieldConfig>[] };
        if (!parsed.tableName || !Array.isArray(parsed.fieldList) || !parsed.fieldList.length) {
            MessagePlugin.error('JSON 格式不正确，需包含 tableName 与 fieldList');
            return;
        }

        tableConfig.value = {
            tableName: parsed.tableName,
            tableComment: parsed.tableComment || '',
            fieldList: parsed.fieldList.map((field, index) => normalizeField(field, index)),
        };
        currentConfigId.value = null;
        expandedFields.value = [tableConfig.value.fieldList[0].id];
        MessagePlugin.success('配置导入成功');
    } catch {
        MessagePlugin.error('JSON 解析失败，请检查格式');
    }
}

/** 应用 CREATE TABLE SQL 反向导入 */
function handleImportSqlConfirm(value: string) {
    try {
        const parsed = parseCreateTableSql(value);
        tableConfig.value = {
            tableName: parsed.tableName,
            tableComment: parsed.tableComment || '',
            fieldList: parsed.fieldList.map((field, index) => normalizeField(field, index)),
        };
        currentConfigId.value = null;
        expandedFields.value = [tableConfig.value.fieldList[0].id];
        MessagePlugin.success(`反向导入成功，共 ${parsed.fieldList.length} 个字段`);
    } catch (error) {
        MessagePlugin.error(error instanceof Error ? error.message : String(error));
    }
}

/** 导入已保存表配置 */
function handleImportSavedTable(item: SavedTableConfig) {
    currentConfigId.value = item.id;
    tableConfig.value = {
        tableName: item.tableName,
        tableComment: item.tableComment,
        fieldList: item.fieldList.map((field, index) => normalizeField(field, index)),
    };
    expandedFields.value = [tableConfig.value.fieldList[0].id];
    importTableVisible.value = false;
    MessagePlugin.success('表配置已导入');
}

/** 删除已保存表配置 */
async function handleDeleteSavedTable(id: string) {
    try {
        await deleteTableConfig(id);
        if (currentConfigId.value === id) {
            currentConfigId.value = null;
        }
        await loadSavedTables();
        MessagePlugin.success('删除成功');
    } catch (error) {
        MessagePlugin.error(String(error));
    }
}

watch(importTableVisible, (visible) => {
    if (visible) {
        loadSavedTables();
    }
});

onMounted(() => {
    loadDraft();
    loadSavedTables();
    loadMockPools();
});
</script>

<template>
    <div class="database-page">
        <div class="database-page__layout">
            <div class="database-page__config">
                <div class="database-page__config-header">
                    <div class="database-page__config-title">
                        表格配置<span>({{ fieldCount }})</span>
                    </div>
                    <div class="database-page__config-actions">
                        <t-button variant="outline" @click="lazyConfigVisible = true">懒人配置</t-button>
                        <t-button variant="outline" @click="importConfigVisible = true">导入配置</t-button>
                        <t-button variant="outline" @click="importSqlVisible = true">反向导入</t-button>
                        <t-button variant="outline" @click="handleImportBaseFields">导入基本数据</t-button>
                    </div>
                </div>

                <div class="database-page__base-form">
                    <div class="database-page__form-item">
                        <div class="database-page__form-label">表名</div>
                        <t-input v-model="tableConfig.tableName" placeholder="请输入表名" />
                    </div>
                    <div class="database-page__form-item">
                        <div class="database-page__form-label">描述</div>
                        <t-input v-model="tableConfig.tableComment" placeholder="请输入描述" />
                    </div>
                </div>

                <VueDraggable
                    v-model="tableConfig.fieldList"
                    handle=".database-page__drag-handle"
                    :animation="200"
                    class="database-page__fields"
                >
                    <div
                        v-for="field in tableConfig.fieldList"
                        :key="field.id"
                        class="database-page__field-item"
                    >
                        <div
                            class="database-page__field-header"
                            @click="toggleFieldExpand(field.id)"
                        >
                            <span class="database-page__drag-handle" @click.stop>
                                <MyIcon name="Move" :size="16" />
                            </span>
                            <span>字段名</span>
                            <t-input
                                v-model="field.fieldName"
                                placeholder="字段名"
                                class="database-page__field-name"
                                @click.stop
                            />
                            <MyIcon
                                :name="isFieldExpanded(field.id) ? 'ChevronUp' : 'ChevronDown'"
                                :size="16"
                                class="database-page__field-expand"
                            />
                            <t-button
                                theme="danger"
                                variant="text"
                                size="small"
                                @click.stop="handleDeleteField(field.id)"
                            >
                                删除
                            </t-button>
                        </div>

                        <div v-show="isFieldExpanded(field.id)" class="database-page__field-body">
                            <div class="database-page__section">
                                <div class="database-page__section-title">数据库配置</div>
                                <div class="database-page__section-grid">
                                    <div class="database-page__form-item">
                                        <div class="database-page__form-label">类型</div>
                                        <t-select v-model="field.fieldType" :options="FIELD_TYPE_OPTIONS" />
                                    </div>
                                    <div class="database-page__form-item">
                                        <div class="database-page__form-label">默认值</div>
                                        <t-input v-model="field.defaultValue" placeholder="默认值" />
                                    </div>
                                    <div class="database-page__form-item">
                                        <div class="database-page__form-label">描述</div>
                                        <t-input v-model="field.comment" placeholder="字段描述" />
                                    </div>
                                    <div class="database-page__form-item">
                                        <div class="database-page__form-label">模拟数据</div>
                                        <t-select
                                            v-model="field.mockType"
                                            :options="mockPoolOptions"
                                            clearable
                                            placeholder="请选择模拟数据"
                                        />
                                    </div>
                                </div>
                                <div class="database-page__checkbox-group">
                                    <span class="database-page__form-label">配置</span>
                                    <t-checkbox v-model="field.primaryKey">主键</t-checkbox>
                                    <t-checkbox v-model="field.autoIncrement">自增</t-checkbox>
                                    <t-checkbox v-model="field.notNull">非空</t-checkbox>
                                    <t-checkbox v-model="field.indexed">索引</t-checkbox>
                                </div>
                            </div>

                            <div class="database-page__section">
                                <div class="database-page__section-title">java 配置</div>
                                <div class="database-page__checkbox-group">
                                    <t-checkbox v-model="field.mybatis">mybatis</t-checkbox>
                                    <t-checkbox v-model="field.swagger">swagger</t-checkbox>
                                </div>
                            </div>

                            <div class="database-page__section">
                                <div class="database-page__section-title">表格配置</div>
                                <div class="database-page__checkbox-group">
                                    <t-checkbox v-model="field.hideInSearch">隐藏搜索项</t-checkbox>
                                    <t-checkbox v-model="field.hideInTable">隐藏表格</t-checkbox>
                                    <t-checkbox v-model="field.formSlot">表单插槽</t-checkbox>
                                    <t-checkbox v-model="field.searchSlot">搜索项插槽</t-checkbox>
                                </div>
                                <div class="database-page__form-item database-page__form-item--full">
                                    <div class="database-page__form-label">高级表格搜索类型</div>
                                    <t-select v-model="field.advancedSearchType" :options="SEARCH_TYPE_OPTIONS" />
                                </div>
                            </div>

                            <div class="database-page__section">
                                <div class="database-page__section-title">表单配置</div>
                                <div class="database-page__checkbox-group">
                                    <t-checkbox v-model="field.hideInForm">隐藏于表单</t-checkbox>
                                    <t-checkbox v-model="field.disabled">禁用</t-checkbox>
                                    <t-checkbox v-model="field.readOnly">只读</t-checkbox>
                                </div>
                            </div>
                        </div>
                    </div>
                </VueDraggable>

                <div class="database-page__footer-actions">
                    <t-button variant="outline" block @click="handleAddField">+ 添加字段</t-button>
                    <t-button variant="outline" block @click="importTableVisible = true">导入表</t-button>
                </div>

                <div class="database-page__submit-actions">
                    <t-button variant="outline" :loading="saving" @click="handleSaveDraft">保存</t-button>
                    <t-button variant="outline" @click="handleReset">重置</t-button>
                    <t-button theme="primary" @click="handleGenerate">一键生成</t-button>
                </div>
            </div>

            <div class="database-page__result">
                <ResultPanel
                    v-model:insert-count="insertCount"
                    :result="generateResult"
                    :table-config="tableConfig"
                    :mock-pool-map="mockPoolMap"
                />
            </div>
        </div>

        <LazyConfigModal v-model:visible="lazyConfigVisible" @confirm="handleLazyConfigConfirm" />
        <ImportConfigModal v-model:visible="importConfigVisible" @confirm="handleImportConfigConfirm" />
        <ImportSqlModal v-model:visible="importSqlVisible" @confirm="handleImportSqlConfirm" />
        <ImportTableModal
            v-model:visible="importTableVisible"
            v-model:keyword="importTableKeyword"
            :tables="filteredSavedTables"
            @import="handleImportSavedTable"
            @delete="handleDeleteSavedTable"
        />
    </div>
</template>

<style scoped lang="scss">
.database-page {
    min-height: 100%;
    color: var(--td-text-color-primary);
}

.database-page__layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
}

.database-page__config,
.database-page__result {
    padding: 20px;
    border-radius: var(--td-radius-large);
    background: var(--td-bg-color-container);
}

.database-page__config-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
}

.database-page__config-title {
    font-size: 16px;
    font-weight: 600;

    span {
        margin-left: 4px;
        color: var(--td-text-color-secondary);
        font-weight: 400;
    }
}

.database-page__config-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
}

.database-page__base-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.database-page__form-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.database-page__form-item--full {
    margin-top: 12px;
}

.database-page__form-label {
    font-size: 13px;
    color: var(--td-text-color-secondary);
}

.database-page__fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.database-page__field-item {
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-large);
    overflow: hidden;
    background: var(--td-bg-color-container);
}

.database-page__field-body {
    padding: 16px;
    border-top: 1px solid var(--td-component-border);
    background: var(--td-bg-color-container);
}

.database-page__drag-handle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--td-text-color-placeholder);
    cursor: grab;

    &:active {
        cursor: grabbing;
    }
}

.database-page__field-expand {
    flex-shrink: 0;
    color: var(--td-text-color-secondary);
}

.database-page__field-header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    background: var(--td-bg-color-secondarycontainer);
    cursor: pointer;
}

.database-page__field-name {
    flex: 1;
}

.database-page__section + .database-page__section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--td-component-border);
}

.database-page__section-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 500;
}

.database-page__section-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.database-page__checkbox-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 16px;
    margin-top: 12px;
}

.database-page__footer-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
}

.database-page__submit-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
}

@media (max-width: 1200px) {
    .database-page__layout {
        grid-template-columns: 1fr;
    }
}
</style>
