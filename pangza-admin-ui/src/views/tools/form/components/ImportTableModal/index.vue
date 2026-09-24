<script setup lang="ts">
import { getTableConfigList } from '@/api/tableConfig';
import type { SavedTableConfig } from '@/views/tools/database/types';
import { toSavedTableConfig } from '@/views/tools/database/utils/tableConfigMapper';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
    import: [item: SavedTableConfig];
}>();

const loading = ref(false);
const keyword = ref('');
const tableList = ref<SavedTableConfig[]>([]);

const filteredTables = computed(() => {
    const value = keyword.value.trim().toLowerCase();
    if (!value) {
        return tableList.value;
    }
    return tableList.value.filter((item) => {
        return item.tableName.toLowerCase().includes(value)
            || item.tableComment.toLowerCase().includes(value);
    });
});

/** 加载库表列表 */
async function loadTableList() {
    loading.value = true;
    try {
        const list = await getTableConfigList();
        tableList.value = list.map(toSavedTableConfig);
    } catch (error) {
        tableList.value = [];
        MessagePlugin.error(String(error));
    } finally {
        loading.value = false;
    }
}

/** 导入库表 */
function handleImport(item: SavedTableConfig) {
    emit('import', item);
    visible.value = false;
}

watch(visible, (value) => {
    if (value) {
        keyword.value = '';
        loadTableList();
    }
});
</script>

<template>
    <t-dialog
        v-model:visible="visible"
        header="选择库表"
        width="760px"
        :footer="false"
        destroy-on-close
    >
        <t-input
            v-model="keyword"
            placeholder="搜索表名或表描述"
            clearable
        >
            <template #suffix-icon>
                <MyIcon name="Search" :size="16" />
            </template>
        </t-input>

        <t-loading :loading="loading" size="small">
            <div class="import-table-modal__list">
                <div
                    v-for="item in filteredTables"
                    :key="item.id"
                    class="import-table-modal__item"
                >
                    <div class="import-table-modal__item-main">
                        <div class="import-table-modal__item-title">{{ item.tableComment || item.tableName }}</div>
                        <div class="import-table-modal__item-meta">表名：{{ item.tableName }}</div>
                        <div class="import-table-modal__item-meta">表描述：{{ item.tableComment || '-' }}</div>
                        <div class="import-table-modal__item-meta">
                            字段：{{ item.fieldList.map((field) => field.fieldName).join(', ') || '-' }}
                        </div>
                    </div>
                    <t-button size="small" theme="primary" @click="handleImport(item)">
                        创建表单
                    </t-button>
                </div>

                <t-empty v-if="!loading && !filteredTables.length" description="暂无库表配置" />
            </div>
        </t-loading>
    </t-dialog>
</template>

<style scoped lang="scss">
.import-table-modal__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
    max-height: 480px;
    overflow: auto;
}

.import-table-modal__item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 16px;
    background: var(--td-bg-color-container);
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-large);
}

.import-table-modal__item-title {
    font-size: 15px;
    font-weight: 600;
}

.import-table-modal__item-meta {
    margin-top: 6px;
    font-size: 13px;
    color: var(--td-text-color-secondary);
}
</style>
