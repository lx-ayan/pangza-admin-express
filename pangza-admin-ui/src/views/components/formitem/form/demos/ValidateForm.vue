<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';

const options: ProFormOption[] = [
    {
        name: 'username',
        label: '用户名',
        rules: [{ required: true, message: '请输入用户名' }],
        gridProps: { colSpan: 12 },
    },
    {
        name: 'email',
        label: '邮箱',
        rules: [
            { required: true, message: '请输入邮箱' },
            { email: true, message: '邮箱格式不正确' },
        ],
        gridProps: { colSpan: 12 },
    },
    {
        name: 'password',
        label: '密码',
        rules: [
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少 6 位' },
        ],
        props: {
            inputProps: { type: 'password' },
        },
        gridProps: { colSpan: 12 },
    },
    {
        name: 'confirmPassword',
        label: '确认密码',
        rules: [{ required: true, message: '请再次输入密码' }],
        props: {
            inputProps: { type: 'password' },
        },
        gridProps: { colSpan: 12 },
    },
];

/**
 * 校验通过后提交
 */
function handleSubmit(data: Record<string, any>) {
    if (data.password !== data.confirmPassword) {
        MessagePlugin.error('两次密码不一致');
        return Promise.reject('两次密码不一致');
    }
    MessagePlugin.success('校验通过并提交成功');
}
</script>

<template>
    <div class="max-w-3xl">
        <ProForm
            :options="options"
            :submit="handleSubmit"
            :form-props="{ labelAlign: 'top' }"
            :gap="{ x: 6, y: 4 }"
            submit-text="提交"
        />
    </div>
</template>
