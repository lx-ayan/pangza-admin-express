<script setup lang="ts">
import type { FormDesignerItem } from '../types';

defineProps<{
    item: FormDesignerItem;
    preview?: boolean;
}>();
</script>

<template>
    <div class="form-item-preview__control">
        <template v-if="item.type === 'input'">
            <t-input
                :placeholder="item.placeholder"
                :maxlength="item.maxLength"
                :show-limit-number="item.showLimitNumber"
                :clearable="item.clearable"
                :readonly="item.readonly"
                :disabled="item.disabled"
                :style="{ width: item.width }"
            />
        </template>

        <template v-else-if="item.type === 'textarea'">
            <t-textarea
                :placeholder="item.placeholder"
                :maxlength="item.maxLength"
                :show-limit-number="item.showLimitNumber"
                :readonly="item.readonly"
                :disabled="item.disabled"
                :style="{ width: item.width }"
            />
        </template>

        <template v-else-if="item.type === 'password'">
            <t-input
                type="password"
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :readonly="item.readonly"
                :disabled="item.disabled"
                :style="{ width: item.width }"
            />
        </template>

        <template v-else-if="item.type === 'inputNumber'">
            <t-input-number
                :min="item.min"
                :max="item.max"
                :step="item.step"
                :disabled="item.disabled"
                :style="{ width: item.width }"
            />
        </template>

        <template v-else-if="item.type === 'select'">
            <t-select
                :placeholder="item.placeholder"
                :options="item.options"
                :clearable="item.clearable"
                :disabled="item.disabled"
                :style="{ width: item.width }"
            />
        </template>

        <template v-else-if="item.type === 'cascader'">
            <t-cascader
                :placeholder="item.placeholder"
                :options="item.options as any"
                :clearable="item.clearable"
                :disabled="item.disabled"
                :style="{ width: item.width }"
            />
        </template>

        <template v-else-if="item.type === 'radio'">
            <t-radio-group :options="item.options" :disabled="item.disabled" />
        </template>

        <template v-else-if="item.type === 'checkbox'">
            <t-checkbox-group :options="item.options" :disabled="item.disabled" />
        </template>

        <template v-else-if="item.type === 'switch'">
            <t-switch :disabled="item.disabled" />
        </template>

        <template v-else-if="item.type === 'slider'">
            <t-slider :min="item.min" :max="item.max" :step="item.step" :disabled="item.disabled" />
        </template>

        <template v-else-if="item.type === 'timePicker'">
            <t-time-picker
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :disabled="item.disabled"
                :style="{ width: item.width }"
            />
        </template>

        <template v-else-if="item.type === 'timeRangePicker'">
            <t-time-range-picker :clearable="item.clearable" :disabled="item.disabled" :style="{ width: item.width }" />
        </template>

        <template v-else-if="item.type === 'datePicker'">
            <t-date-picker
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :disabled="item.disabled"
                :style="{ width: item.width }"
            />
        </template>

        <template v-else-if="item.type === 'dateRangePicker'">
            <t-date-range-picker :clearable="item.clearable" :disabled="item.disabled" :style="{ width: item.width }" />
        </template>

        <template v-else-if="item.type === 'rate'">
            <t-rate :count="item.max || 5" :disabled="item.disabled" />
        </template>

        <template v-else-if="item.type === 'colorPicker'">
            <t-color-picker :disabled="item.disabled" />
        </template>

        <template v-else-if="item.type === 'upload'">
            <t-upload theme="file" :disabled="item.disabled">{{ item.buttonText || '点击上传' }}</t-upload>
        </template>

        <template v-else-if="item.type === 'button'">
            <t-button :theme="item.buttonTheme || 'primary'" :disabled="item.disabled">
                {{ item.buttonText || item.label }}
            </t-button>
        </template>

        <template v-else-if="item.type === 'row'">
            <div class="form-item-preview__row">
                <slot />
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
.form-item-preview__control {
    width: 100%;
}

.form-item-preview__row {
    width: 100%;
    min-height: 80px;
    padding: 12px;
    background: var(--td-bg-color-secondarycontainer);
    border: 1px dashed var(--td-component-border);
    border-radius: var(--td-radius-default);
}
</style>
