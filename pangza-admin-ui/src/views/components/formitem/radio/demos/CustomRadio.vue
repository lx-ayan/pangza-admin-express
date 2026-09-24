<script setup lang="tsx">
import { reactive } from 'vue';
import CircleTag from '@/components/public/CircleTag/index.vue';

const formData = reactive({
    status: '1',
});

const data = [
    {
        label: '启用',
        value: '1',
        render: () => (
            <CircleTag color="var(--td-success-color)">启用</CircleTag>
        ),
    },
    {
        label: '禁用',
        value: '2',
        render: () => (
            <CircleTag color="var(--td-error-color)">禁用</CircleTag>
        ),
    },
];
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormRadio
            v-model="formData.status"
            name="status"
            label="状态"
            :data="data"
        >
            <template #option-1="{ option }">
                <span class="text-[var(--td-success-color)]">{{ option.label }}（插槽）</span>
            </template>
        </ProFormRadio>
    </t-form>
</template>
