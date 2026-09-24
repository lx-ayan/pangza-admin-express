<script setup lang="tsx">
import { reactive } from 'vue';
import CircleTag from '@/components/public/CircleTag/index.vue';

const formData = reactive({
    tags: ['a'] as string[],
});

const data = [
    {
        label: '标签 A',
        value: 'a',
        render: () => (
            <CircleTag color="var(--td-brand-color)">标签 A</CircleTag>
        ),
    },
    {
        label: '标签 B',
        value: 'b',
        render: () => (
            <CircleTag color="var(--td-warning-color)">标签 B</CircleTag>
        ),
    },
];
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormCheckbox
            v-model="formData.tags"
            name="tags"
            label="标签"
            :data="data"
        >
            <template #option-a="{ option }">
                <span class="text-[var(--td-brand-color)]">{{ option.label }}（插槽）</span>
            </template>
        </ProFormCheckbox>
    </t-form>
</template>
