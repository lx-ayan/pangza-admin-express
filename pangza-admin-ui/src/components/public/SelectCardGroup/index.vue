<script setup lang='ts'>
import type { SelectCardOption } from './types';
import { CheckIcon } from 'tdesign-icons-vue-next';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
    /** 选项列表 */
    options?: SelectCardOption[];
    /** 是否多选 */
    multiple?: boolean;
    /** 网格列数 */
    columns?: number;
    /** 空数据提示 */
    emptyText?: string;
}>(), {
    options: () => [],
    multiple: false,
    columns: 2,
    emptyText: '暂无数据',
});

/** 选中值：单选为单个值，多选为数组 */
const modelValue = defineModel<string | number | Array<string | number> | undefined>('modelValue');

const gridStyle = computed(() => ({
    gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`,
}));

/**
 * 判断选项是否选中
 */
function isSelected(value: string | number) {
    if (props.multiple) {
        return Array.isArray(modelValue.value) && modelValue.value.includes(value);
    }
    return modelValue.value === value;
}

/**
 * 点击选项切换选中状态
 */
function handleSelect(option: SelectCardOption) {
    if (option.disabled) {
        return;
    }
    if (props.multiple) {
        const current = Array.isArray(modelValue.value) ? [...modelValue.value] : [];
        const index = current.indexOf(option.value);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(option.value);
        }
        modelValue.value = current;
        return;
    }
    modelValue.value = modelValue.value === option.value ? undefined : option.value;
}

defineOptions({
    globalComponent: true,
    name: 'SelectCardGroup',
});
</script>

<template>
    <div class="select-card-group">
        <div v-if="props.options.length" class="select-card-group__grid" :style="gridStyle">
            <div
                v-for="option in props.options"
                :key="String(option.value)"
                class="select-card"
                :class="{
                    'select-card--active': isSelected(option.value),
                    'select-card--disabled': option.disabled,
                }"
                @click="handleSelect(option)"
            >
                <slot name="option" :option="option" :selected="isSelected(option.value)">
                    <div class="select-card__title">{{ option.label }}</div>
                    <div v-if="option.description" class="select-card__desc">
                        {{ option.description }}
                    </div>
                </slot>
                <div v-if="isSelected(option.value)" class="select-card__corner">
                    <CheckIcon class="select-card__check" size="12px" />
                </div>
            </div>
        </div>
        <div v-else class="select-card-group__empty">
            {{ props.emptyText }}
        </div>
    </div>
</template>

<style scoped lang="scss">
.select-card-group {
    &__grid {
        display: grid;
        gap: 12px;
    }

    &__empty {
        text-align: center;
        padding: 24px 0;
        color: var(--td-text-color-placeholder);
    }
}

.select-card {
    position: relative;
    overflow: hidden;
    padding: 16px 18px;
    min-height: 88px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid transparent;
    background: var(--td-bg-color-secondarycontainer);
    transition: border-color 0.2s;
    box-sizing: border-box;

    &:hover:not(.select-card--disabled) {
        border-color: var(--td-brand-color-light);
    }

    &--active {
        border-color: var(--td-brand-color);
    }

    &--disabled {
        cursor: not-allowed;
        opacity: 0.55;
    }

    &__title {
        font-size: 15px;
        font-weight: 600;
        line-height: 1.4;
        color: var(--td-text-color-primary);
        margin-bottom: 8px;
    }

    &__desc {
        font-size: 13px;
        line-height: 1.5;
        color: var(--td-text-color-secondary);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    &__corner {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 0;
        height: 0;
        border-style: solid;
        border-width: 0 0 28px 28px;
        border-color: transparent transparent var(--td-brand-color) transparent;
    }

    &__check {
        position: absolute;
        right: 2px;
        bottom: -25px;
        color: #fff;
    }
}
</style>
