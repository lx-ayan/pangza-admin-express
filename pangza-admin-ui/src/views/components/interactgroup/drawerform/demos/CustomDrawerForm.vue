<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const visible = ref(false);

const options: ProFormOption[] = [
    {
        name: 'title',
        label: '标题',
        rules: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    },
    {
        name: 'tip',
        label: '自定义区域',
        type: () => (
            <div class="pl-2 text-base border-l-4 border-[var(--td-brand-color)]">
                type 函数自定义内容
            </div>
        ),
    },
    {
        name: 'slotSetting',
        label: '插槽区域',
    },
];

/**
 * 提交表单
 */
function handleSubmit(data: Record<string, unknown>) {
    MessagePlugin.success(`提交成功：${JSON.stringify(data)}`);
    visible.value = false;
}
</script>

<template>
    <div>
        <t-button theme="primary" @click="visible = true">自定义渲染</t-button>
        <DrawerForm
            v-model:visible="visible"
            header="自定义表单项"
            width="520px"
            :options="options"
            @submit="handleSubmit"
        >
            <template #form-slotSetting>
                <div class="text-[var(--td-text-color-secondary)]">
                    我是 #form-slotSetting 插槽内容
                </div>
            </template>
        </DrawerForm>
    </div>
</template>
