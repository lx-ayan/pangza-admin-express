<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';

const half = { colSpan: 12 };

const options: ProFormOption[] = [
    { name: 'input', label: '输入框', gridProps: half },
    {
        name: 'select',
        label: '选择器',
        type: 'select',
        gridProps: half,
        data: [
            { label: '选项1', value: '1' },
            { label: '选项2', value: '2' },
        ],
    },
    {
        name: 'radio',
        label: '单选',
        type: 'radio',
        gridProps: half,
        data: [
            { label: '选项1', value: '1' },
            { label: '选项2', value: '2' },
        ],
    },
    {
        name: 'checkbox',
        label: '复选',
        type: 'checkbox',
        gridProps: half,
        data: [
            { label: '选项1', value: '1' },
            { label: '选项2', value: '2' },
        ],
    },
    { name: 'datePicker', label: '日期', type: 'datePicker', gridProps: half },
    { name: 'dateRangePicker', label: '日期范围', type: 'dateRangePicker', gridProps: half },
    { name: 'inputNumber', label: '数字', type: 'inputNumber', gridProps: half },
    { name: 'textarea', label: '文本域', type: 'textarea' },
];

/**
 * 提交表单
 */
function handleSubmit(data: Record<string, unknown>) {
    MessagePlugin.success(`提交成功：${JSON.stringify(data)}`);
}
</script>

<template>
    <ProForm
        :options="options"
        :gap="{ x: 4, y: 4 }"
        :form-props="{ labelAlign: 'top' }"
        :submit="handleSubmit"
    />
</template>
