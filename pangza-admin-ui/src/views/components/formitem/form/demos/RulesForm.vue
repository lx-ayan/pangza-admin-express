<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';

const options: ProFormOption[] = [
    {
        name: 'username',
        label: '用户名',
        rules: [
            { required: true, message: '请输入用户名', trigger: 'blur' },
            { min: 2, max: 12, message: '长度为 2-12 个字符', trigger: 'blur' },
        ],
    },
    {
        name: 'phone',
        label: '手机号',
        rules: [
            { required: true, message: '请输入手机号', trigger: 'blur' },
            { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
        ],
    },
    {
        name: 'status',
        label: '状态',
        type: 'select',
        data: [
            { label: '启用', value: '1' },
            { label: '禁用', value: '2' },
        ],
        rules: [{ required: true, message: '请选择状态', trigger: 'change' }],
    },
];

/**
 * 校验通过后提交
 */
function handleSubmit(data: Record<string, unknown>) {
    MessagePlugin.success(`校验通过：${JSON.stringify(data)}`);
}
</script>

<template>
    <ProForm
        :options="options"
        :gap="{ y: 4 }"
        :form-props="{ labelAlign: 'top' }"
        :submit="handleSubmit"
    />
</template>
