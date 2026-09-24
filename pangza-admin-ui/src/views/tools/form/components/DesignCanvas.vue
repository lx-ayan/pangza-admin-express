<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import FormItemPreview from './FormItemPreview.vue';
import type { FormDesignerItem } from '../types';

defineProps<{
    items: FormDesignerItem[];
    activeId: string | null;
    formConfig: {
        labelWidth: number | string;
        labelAlign: 'left' | 'right' | 'top';
        colon: boolean;
        size: 'small' | 'medium' | 'large';
    };
}>();

const emit = defineEmits<{
    'update:items': [items: FormDesignerItem[]];
    select: [id: string];
    copy: [id: string];
    delete: [id: string];
}>();

/** 更新列表 */
function updateItems(items: FormDesignerItem[]) {
    emit('update:items', items);
}

/** 选中组件 */
function handleSelect(id: string) {
    emit('select', id);
}

/** 复制组件 */
function handleCopy(id: string, event: Event) {
    event.stopPropagation();
    emit('copy', id);
}

/** 删除组件 */
function handleDelete(id: string, event: Event) {
    event.stopPropagation();
    emit('delete', id);
}

/** 获取栅格占位 */
function getItemSpan(item: FormDesignerItem) {
    return item.type === 'row' ? 24 : (item.span ?? 24);
}

/** 根据栅格计算组件宽度（24 栅格，列间距 12px） */
function getItemWidth(item: FormDesignerItem) {
    const span = getItemSpan(item);
    return {
        '--span': span,
        width: `calc(100% / 24 * ${span} - 12px * ${(24 - span) / 24})`,
    };
}
</script>

<template>
    <div class="design-canvas" @click.self="emit('select', '')">
        <div class="design-canvas__toolbar">
            <slot name="toolbar" />
        </div>

        <div class="design-canvas__body">
            <t-form
                :label-width="formConfig.labelWidth"
                :label-align="formConfig.labelAlign"
                :colon="formConfig.colon"
                :size="formConfig.size"
                class="design-canvas__form"
            >
                <VueDraggable
                    :model-value="items"
                    class="design-canvas__list"
                    :class="{ 'design-canvas__list--empty': !items.length }"
                    group="form-designer"
                    handle=".design-canvas__drag-handle"
                    :animation="200"
                    item-key="id"
                    @update:model-value="updateItems"
                >
                    <div
                        v-for="item in items"
                        :key="item.id"
                        class="design-canvas__item"
                        :class="{ 'design-canvas__item--active': activeId === item.id }"
                        :style="getItemWidth(item)"
                        @click.stop="handleSelect(item.id)"
                    >
                        <div class="design-canvas__item-actions">
                            <t-button
                                size="small"
                                variant="text"
                                shape="square"
                                @click="handleCopy(item.id, $event)"
                            >
                                <MyIcon name="Copy" :size="14" />
                            </t-button>
                            <t-button
                                size="small"
                                variant="text"
                                shape="square"
                                theme="danger"
                                @click="handleDelete(item.id, $event)"
                            >
                                <MyIcon name="Delete" :size="14" />
                            </t-button>
                        </div>

                        <span class="design-canvas__drag-handle">
                            <MyIcon name="Move" :size="14" />
                        </span>

                        <t-form-item
                            v-if="item.type !== 'button' && item.type !== 'row'"
                            :label="item.label"
                            :required-mark="item.required"
                        >
                            <FormItemPreview :item="item" />
                        </t-form-item>

                        <div v-else-if="item.type === 'row'" class="design-canvas__row-wrap">
                            <div class="design-canvas__row-label">{{ item.label }}</div>
                            <FormItemPreview :item="item">
                                <VueDraggable
                                    v-if="item.children"
                                    v-model="item.children"
                                    class="design-canvas__row-list"
                                    group="form-designer"
                                    :animation="200"
                                    item-key="id"
                                >
                                    <div
                                        v-for="child in item.children"
                                        :key="child.id"
                                        class="design-canvas__item design-canvas__item--nested"
                                        :class="{ 'design-canvas__item--active': activeId === child.id }"
                                        :style="getItemWidth(child)"
                                        @click.stop="handleSelect(child.id)"
                                    >
                                        <t-form-item :label="child.label" :required-mark="child.required">
                                            <FormItemPreview :item="child" />
                                        </t-form-item>
                                    </div>
                                </VueDraggable>
                            </FormItemPreview>
                        </div>

                        <t-form-item v-else>
                            <FormItemPreview :item="item" />
                        </t-form-item>
                    </div>
                </VueDraggable>

                <div v-if="!items.length" class="design-canvas__empty">
                    从左侧拖入或点击组件进行添加
                </div>
            </t-form>
        </div>
    </div>
</template>

<style scoped lang="scss">
.design-canvas {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: var(--td-bg-color-container);
}

.design-canvas__toolbar {
    display: flex;
    flex-shrink: 0;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--td-component-border);
}

.design-canvas__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    padding: 16px;
    overflow: auto;
    overscroll-behavior: contain;
}

.design-canvas__form {
    width: 100%;
    min-height: 0;

    :deep(.t-form__item) {
        margin-bottom: 0;
    }
}

.design-canvas__list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    align-content: flex-start;
    width: 100%;
}

.design-canvas__list--empty {
    position: relative;
    min-height: 320px;
}

.design-canvas__item {
    position: relative;
    box-sizing: border-box;
    flex: 0 0 auto;
    padding: 6px 8px 6px 24px;

    :deep(.t-form__item) {
        margin-bottom: 0;
    }
    background: var(--td-bg-color-container);
    border: 1px solid transparent;
    border-radius: var(--td-radius-default);
    transition: border-color 0.2s;

    &:hover,
    &--active {
        border-color: var(--td-brand-color);
    }

    &:hover .design-canvas__item-actions,
    &--active .design-canvas__item-actions {
        opacity: 1;
    }
}

.design-canvas__item--nested {
    padding-left: 12px;
}

.design-canvas__item-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
}

.design-canvas__drag-handle {
    position: absolute;
    top: 12px;
    left: 6px;
    color: var(--td-text-color-placeholder);
    cursor: grab;
}

.design-canvas__row-wrap {
    width: 100%;
}

.design-canvas__row-label {
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--td-text-color-secondary);
}

.design-canvas__row-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    align-content: flex-start;
    min-height: 40px;
}

.design-canvas__empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--td-text-color-placeholder);
    pointer-events: none;
}
</style>
