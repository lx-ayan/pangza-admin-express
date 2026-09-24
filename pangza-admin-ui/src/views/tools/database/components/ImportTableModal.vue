<script setup lang="ts">
import type { SavedTableConfig } from '../types';

defineProps<{
    tables: SavedTableConfig[];
    keyword: string;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
    import: [item: SavedTableConfig];
    delete: [id: string];
    'update:keyword': [value: string];
}>();
</script>

<template>
    <t-drawer
        v-model:visible="visible"
        header="选择表"
        size="760px"
        :footer="false"
        destroy-on-close
    >
        <t-input
            :model-value="keyword"
            placeholder="请输入表描述"
            clearable
            @update:model-value="emit('update:keyword', $event)"
        >
            <template #suffix-icon>
                <MyIcon name="Search" :size="16" />
            </template>
        </t-input>

        <div class="import-table-modal__list">
            <div
                v-for="item in tables"
                :key="item.id"
                class="import-table-modal__item"
            >
                <div class="import-table-modal__item-main">
                    <div class="import-table-modal__item-title">{{ item.tableComment || item.tableName }}</div>
                    <div class="import-table-modal__item-meta">表名：{{ item.tableName }}</div>
                    <div class="import-table-modal__item-meta">表注释：{{ item.tableComment || '-' }}</div>
                    <div class="import-table-modal__item-meta">
                        列名：{{ item.fieldList.map((field) => field.fieldName).join(', ') }}
                    </div>
                </div>
                <div class="import-table-modal__item-actions">
                    <t-button size="small" theme="primary" @click="emit('import', item)">导入</t-button>
                    <t-button size="small" theme="danger" variant="outline" @click="emit('delete', item.id)">删除</t-button>
                </div>
            </div>

            <t-empty v-if="!tables.length" description="暂无已保存的表配置" />
        </div>
    </t-drawer>
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
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-large);
    background: var(--td-bg-color-container);
}

.import-table-modal__item-title {
    font-size: 15px;
    font-weight: 600;
}

.import-table-modal__item-meta {
    margin-top: 6px;
    color: var(--td-text-color-secondary);
    font-size: 13px;
}

.import-table-modal__item-actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
}
</style>
