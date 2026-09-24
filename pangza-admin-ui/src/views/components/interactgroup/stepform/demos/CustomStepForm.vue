<script setup lang="tsx">
import type { StepFormStepOption } from '@/components/ProComponents/StepForm/types';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const model = ref<Record<string, unknown>>({});

const steps: StepFormStepOption[] = [
    {
        title: '基础配置',
        description: '支持 type 函数自定义表单项',
        options: [
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
        ],
    },
    {
        title: '扩展设置',
        description: '支持 #form-{name} 插槽自定义',
        options: [
            {
                name: 'slotSetting',
                label: '插槽区域',
            },
            {
                name: 'remark',
                label: '备注',
                type: 'textarea',
                placeholder: '可填写补充说明',
            },
        ],
    },
];

/**
 * 提交步骤表单
 */
function handleSubmit(data: Record<string, unknown>) {
    MessagePlugin.success(`提交成功：${JSON.stringify(data)}`);
}
</script>

<template>
    <StepForm
        v-model="model"
        :steps="steps"
        @submit="handleSubmit"
    >
        <template #form-slotSetting>
            <div class="text-[var(--td-text-color-secondary)]">
                我是 #form-slotSetting 插槽内容
            </div>
        </template>
    </StepForm>
</template>
