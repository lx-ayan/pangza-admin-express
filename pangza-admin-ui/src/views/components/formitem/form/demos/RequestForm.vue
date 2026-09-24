<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';

const options: ProFormOption[] = [
    { name: 'username', label: '用户名' },
    { name: 'email', label: '邮箱' },
    {
        name: 'status',
        label: '状态',
        type: 'select',
        data: [
            { label: '启用', value: '1' },
            { label: '禁用', value: '2' },
        ],
    },
];

/**
 * 模拟回填请求
 */
function request() {
    return new Promise<Record<string, string>>((resolve) => {
        setTimeout(() => {
            resolve({
                username: '贾明',
                email: 'demo@example.com',
                status: '1',
            });
        }, 600);
    });
}

/**
 * 提交表单
 */
function handleSubmit(data: Record<string, unknown>) {
    MessagePlugin.success(`保存成功：${JSON.stringify(data)}`);
}
</script>

<template>
    <ProForm
        :options="options"
        :request="request"
        :gap="{ y: 4 }"
        :form-props="{ labelAlign: 'top' }"
        submit-text="保存"
        :submit="handleSubmit"
    />
</template>
