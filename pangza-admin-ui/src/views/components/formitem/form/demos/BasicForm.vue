<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';

const options: ProFormOption[] = [
    {
        name: 'username',
        label: '用户名',
        rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    },
    {
        name: 'email',
        label: '邮箱',
        placeholder: '请输入邮箱',
    },
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
        :gap="{ y: 4 }"
        :form-props="{ labelAlign: 'top' }"
        :submit="handleSubmit"
    />
</template>
