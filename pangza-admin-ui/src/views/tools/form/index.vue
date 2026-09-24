<script setup lang="ts">
import useCopy from '@/hooks/core/useCopy';
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next';
import { computed, ref } from 'vue';
import type { SavedTableConfig } from '@/views/tools/database/types';
import ComponentPanel from './components/ComponentPanel.vue';
import DesignCanvas from './components/DesignCanvas.vue';
import ImportTableModal from './components/ImportTableModal/index.vue';
import PreviewModal from './components/PreviewModal/index.vue';
import PropertyPanel from './components/PropertyPanel.vue';
import { DEFAULT_FORM_CONFIG } from './constants';
import type { FormDesignerConfig, FormDesignerItem } from './types';
import { cloneFormItem } from './utils/createFormItem';
import { createFormItemsFromTable } from './utils/createFormItemsFromTable';
import { downloadVueFile, generateVueCode } from './utils/generateVueCode';

const formItems = ref<FormDesignerItem[]>([]);
const activeId = ref<string | null>(null);
const formConfig = ref<FormDesignerConfig>({ ...DEFAULT_FORM_CONFIG });
const propertyTab = ref('component');
const previewVisible = ref(false);
const importTableVisible = ref(false);

const activeItem = computed(() => {
    if (!activeId.value) {
        return null;
    }
    const findItem = (items: FormDesignerItem[]): FormDesignerItem | null => {
        for (const item of items) {
            if (item.id === activeId.value) {
                return item;
            }
            if (item.children?.length) {
                const child = findItem(item.children);
                if (child) {
                    return child;
                }
            }
        }
        return null;
    };
    return findItem(formItems.value);
});

const generatedCode = computed(() => generateVueCode(formItems.value, formConfig.value));

/** 添加组件 */
function handleAddItem(item: FormDesignerItem) {
    formItems.value.push(item);
    activeId.value = item.id;
}

/** 选中组件 */
function handleSelect(id: string) {
    activeId.value = id || null;
}

/** 复制组件 */
function handleCopy(id: string) {
    const index = formItems.value.findIndex((item) => item.id === id);
    if (index === -1) {
        return;
    }
    const copied = cloneFormItem(formItems.value[index]);
    formItems.value.splice(index + 1, 0, copied);
    activeId.value = copied.id;
}

/** 删除组件 */
function handleDelete(id: string) {
    const index = formItems.value.findIndex((item) => item.id === id);
    if (index === -1) {
        return;
    }
    formItems.value.splice(index, 1);
    if (activeId.value === id) {
        activeId.value = null;
    }
}

/** 导出 Vue 文件 */
function handleExportVue() {
    if (!formItems.value.length) {
        MessagePlugin.warning('请先添加表单组件');
        return;
    }
    downloadVueFile(generatedCode.value);
    MessagePlugin.success('导出成功');
}

/** 复制代码 */
function handleCopyCode() {
    if (!formItems.value.length) {
        MessagePlugin.warning('请先添加表单组件');
        return;
    }
    useCopy(generatedCode.value).then(() => {
        MessagePlugin.success('复制成功');
    }).catch((error) => {
        MessagePlugin.error(String(error));
    });
}

/** 代码预览 */
function handlePreviewCode() {
    if (!formItems.value.length) {
        MessagePlugin.warning('请先添加表单组件');
        return;
    }
    previewVisible.value = true;
}

/** 打开库表选择 */
function handleOpenImportTable() {
    importTableVisible.value = true;
}

/** 应用库表字段到画布 */
function applyTableFields(table: SavedTableConfig) {
    const items = createFormItemsFromTable(table.fieldList);
    if (!items.length) {
        MessagePlugin.warning('该库表没有可用于表单的字段');
        return;
    }
    formItems.value = items;
    activeId.value = items[0]?.id ?? null;
    propertyTab.value = 'component';
    MessagePlugin.success(`已根据「${table.tableComment || table.tableName}」创建 ${items.length} 个表单项`);
}

/** 从库表创建表单 */
function handleImportTable(table: SavedTableConfig) {
    if (!formItems.value.length) {
        applyTableFields(table);
        return;
    }
    const instance = DialogPlugin.confirm({
        header: '系统提示',
        body: '当前画布已有组件，确认覆盖并重新创建吗？',
        onConfirm: () => {
            applyTableFields(table);
            instance.destroy();
        },
        onCancel: () => instance.destroy(),
        onClose: () => instance.destroy(),
    });
}

/** 清空画布 */
function handleClear() {
    if (!formItems.value.length) {
        return;
    }
    const instance = DialogPlugin.confirm({
        header: '系统提示',
        body: '确认清空所有组件吗？',
        onConfirm: () => {
            formItems.value = [];
            activeId.value = null;
            instance.destroy();
        },
        onCancel: () => instance.destroy(),
        onClose: () => instance.destroy(),
    });
}
</script>

<template>
    <div>
        <div class="form-designer">
            <aside class="form-designer__left">
                <ComponentPanel @add="handleAddItem" />
            </aside>

            <main class="form-designer__center">
                <DesignCanvas v-model:items="formItems" :active-id="activeId" :form-config="formConfig"
                    @select="handleSelect" @copy="handleCopy" @delete="handleDelete">
                    <template #toolbar>
                        <t-button variant="outline" @click="handleOpenImportTable">选择库表</t-button>
                        <t-button variant="outline" @click="handlePreviewCode">代码预览</t-button>
                        <t-button variant="outline" @click="handleExportVue">导出 vue 文件</t-button>
                        <t-button variant="outline" @click="handleCopyCode">复制代码</t-button>
                        <t-button theme="danger" variant="outline" @click="handleClear">清空</t-button>
                    </template>
                </DesignCanvas>
            </main>

            <aside class="form-designer__right">
                <PropertyPanel v-model:active-tab="propertyTab" :active-item="activeItem" :form-config="formConfig"
                    @update:form-config="formConfig = $event" />
            </aside>
        </div>

        <PreviewModal v-model:visible="previewVisible" :code="generatedCode" />
        <ImportTableModal v-model:visible="importTableVisible" @import="handleImportTable" />
    </div>
</template>

<style scoped lang="scss">
.form-designer {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: var(--td-bg-color-page);
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-large);
    box-sizing: border-box;
}

.form-designer__left {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 280px;
    min-height: 0;
    overflow: hidden;
}

.form-designer__center {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
}

.form-designer__right {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 320px;
    min-height: 0;
    overflow: hidden;
}
</style>
