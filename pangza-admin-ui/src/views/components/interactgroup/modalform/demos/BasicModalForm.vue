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
        name: 'status',
        label: '状态',
        type: 'select',
        data: [
            { label: '启用', value: '1' },
            { label: '禁用', value: '2' },
        ],
    },
    {
        name: 'remark',
        label: '备注',
        type: 'textarea',
        placeholder: '请输入备注',
    },
];

/**
 * 提交弹窗表单
 */
function handleSubmit(data: Record<string, unknown>) {
    MessagePlugin.success(`提交成功：${JSON.stringify(data)}`);
    visible.value = false;
}
</script>

<template>
    <div>
        <t-button theme="primary" @click="visible = true">新增</t-button>
        <ModalForm
            v-model:visible="visible"
            header="新增"
            :options="options"
            @submit="handleSubmit"
        />
    </div>
</template>
