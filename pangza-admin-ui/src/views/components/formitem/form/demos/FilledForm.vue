<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';

const options: ProFormOption[] = [
    { name: 'username', label: '用户名', placeholder: '请输入用户名' },
    {
        name: 'role',
        label: '角色',
        type: 'select',
        data: [
            { label: '管理员', value: 'admin' },
            { label: '编辑', value: 'editor' },
        ],
    },
    { name: 'deadline', label: '截止日期', type: 'datePicker' },
    { name: 'count', label: '数量', type: 'inputNumber' },
    { name: 'remark', label: '备注', type: 'textarea', placeholder: '请输入备注' },
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
        filled
        :options="options"
        :gap="{ y: 4 }"
        :form-props="{ labelAlign: 'top' }"
        :submit="handleSubmit"
    />
</template>
