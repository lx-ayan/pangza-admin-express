<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import { COMPONENT_GROUPS } from '../constants';
import { createFormItem } from '../utils/createFormItem';
import type { FormDesignerItem, PaletteItem } from '../types';

const emit = defineEmits<{
    add: [item: FormDesignerItem];
}>();

/** 克隆组件到画布 */
function handleClone(item: PaletteItem) {
    return createFormItem(item.type, item.label);
}

/** 点击添加组件 */
function handleClickItem(item: PaletteItem) {
    emit('add', createFormItem(item.type, item.label));
}
</script>

<template>
    <div class="component-panel">
        <div v-for="group in COMPONENT_GROUPS" :key="group.title" class="component-panel__group">
            <div class="component-panel__group-title">{{ group.title }}</div>
            <VueDraggable
                :model-value="group.items"
                class="component-panel__list"
                :group="{ name: 'form-designer', pull: 'clone', put: false }"
                :sort="false"
                item-key="type"
                :clone="handleClone"
            >
                <div
                    v-for="item in group.items"
                    :key="item.type"
                    class="component-panel__item"
                    @click="handleClickItem(item)"
                >
                    <MyIcon :name="item.icon" :size="16" />
                    <span>{{ item.label }}</span>
                </div>
            </VueDraggable>
        </div>
    </div>
</template>

<style scoped lang="scss">
.component-panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
    padding: 16px;
    overflow: auto;
    overscroll-behavior: contain;
    background: var(--td-bg-color-container);
    border-right: 1px solid var(--td-component-border);
}

.component-panel__group-title {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.component-panel__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
}

.component-panel__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    font-size: 13px;
    color: var(--td-text-color-primary);
    cursor: grab;
    background: var(--td-bg-color-secondarycontainer);
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-default);
    transition: all 0.2s;

    &:hover {
        color: var(--td-brand-color);
        border-color: var(--td-brand-color);
    }
}
</style>
