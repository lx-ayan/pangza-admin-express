<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';

const options: ProFormOption[] = [
    {
        name: 'username',
        label: '用户名',
        type: 'input',
        rules: [
            { required: true, message: '请输入用户名' },
            { min: 2, message: '至少 2 个字符' },
        ],
        gridProps: { colSpan: 12 },
    },
    {
        name: 'status',
        label: '状态',
        type: 'select',
        data: [
            { label: '启用', value: '1' },
            { label: '禁用', value: '2' },
        ],
        rules: [{ required: true, message: '请选择状态' }],
        gridProps: { colSpan: 12 },
    },
    {
        name: 'gender',
        label: '性别',
        type: 'radio',
        data: [
            { label: '男', value: 'male' },
            { label: '女', value: 'female' },
        ],
        rules: [{ required: true, message: '请选择性别' }],
        gridProps: { colSpan: 12 },
    },
    {
        name: 'hobby',
        label: '爱好',
        type: 'checkbox',
        data: [
            { label: '阅读', value: 'read' },
            { label: '运动', value: 'sport' },
            { label: '音乐', value: 'music' },
        ],
        gridProps: { colSpan: 12 },
    },
    {
        name: 'birthday',
        label: '生日',
        type: 'datePicker',
        gridProps: { colSpan: 12 },
    },
    {
        name: 'range',
        label: '有效期',
        type: 'dateRangePicker',
        gridProps: { colSpan: 12 },
    },
    {
        name: 'age',
        label: '年龄',
        type: 'inputNumber',
        gridProps: { colSpan: 12 },
    },
    {
        name: 'remark',
        label: '备注',
        type: 'textarea',
        gridProps: { colSpan: 24 },
    },
];

/**
 * 提交多类型表单
 */
function handleSubmit(data: Record<string, any>) {
    MessagePlugin.success('提交成功：' + JSON.stringify(data));
}
</script>

<template>
    <ProForm
        :options="options"
        :submit="handleSubmit"
        :form-props="{ labelAlign: 'top' }"
        :gap="{ x: 6, y: 4 }"
        submit-text="提交"
    />
</template>
