<script setup lang="ts">
import { ref } from 'vue';
import type { SelectCardOption } from '@/components/public/SelectCardGroup/types';

/** 自定义插槽选项 */
const options: SelectCardOption[] = [
    { value: 'light', label: '浅色', description: '适合日间使用' },
    { value: 'dark', label: '深色', description: '适合夜间使用' },
];

const theme = ref<string | number | undefined>('light');
</script>

<template>
    <SelectCardGroup v-model="theme" :options="options" :columns="2">
        <template #option="{ option, selected }">
            <div class="flex items-center gap-3">
                <MyIcon
                    :name="option.value === 'dark' ? 'Moon' : 'Sun'"
                    :size="20"
                    :color="selected ? 'var(--td-brand-color)' : 'var(--td-text-color-secondary)'"
                />
                <div>
                    <div class="font-semibold text-[var(--td-text-color-primary)]">{{ option.label }}</div>
                    <div class="text-sm text-[var(--td-text-color-secondary)]">{{ option.description }}</div>
                </div>
            </div>
        </template>
    </SelectCardGroup>
</template>
