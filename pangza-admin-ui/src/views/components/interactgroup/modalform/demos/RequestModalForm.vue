<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const visible = ref(false);

const options: ProFormOption[] = [
    {
        name: 'name',
        label: '名称',
        rules: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    },
    {
        name: 'email',
        label: '邮箱',
        rules: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
    },
    {
        name: 'status',
        label: '状态',
        type: 'radio',
        data: [
            { label: '启用', value: '1' },
            { label: '禁用', value: '2' },
        ],
    },
];

/**
 * 模拟编辑回填
 */
function request() {
    return new Promise<Record<string, string>>((resolve) => {
        setTimeout(() => {
            resolve({
                name: '贾明',
                email: 'demo@example.com',
                status: '1',
            });
        }, 400);
    });
}

/**
 * 保存编辑
 */
function handleSubmit(data: Record<string, unknown>) {
    MessagePlugin.success(`保存成功：${JSON.stringify(data)}`);
    visible.value = false;
}
</script>

<template>
    <div>
        <t-button theme="primary" @click="visible = true">编辑</t-button>
        <ModalForm
            v-model:visible="visible"
            header="编辑"
            :options="options"
            :request="request"
            @submit="handleSubmit"
        />
    </div>
</template>
