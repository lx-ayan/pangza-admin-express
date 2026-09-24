<script setup lang="ts">
import type { StepFormInstance } from '@/components/ProComponents/StepForm/types';
import type { StepFormStepOption } from '@/components/ProComponents/StepForm/types';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref, useTemplateRef } from 'vue';

const stepFormRef = useTemplateRef<StepFormInstance>('stepFormRef');
const model = ref<Record<string, unknown>>({});
const loading = ref(false);

const steps: StepFormStepOption[] = [
    {
        title: '基本信息',
        description: '挂载时通过全局 request 回填',
        options: [
            {
                name: 'name',
                label: '客户名称',
                rules: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
            },
            {
                name: 'phone',
                label: '联系电话',
                rules: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
            },
        ],
    },
    {
        title: '业务信息',
        description: '进入本步时通过 steps[].request 按需回填',
        options: [
            {
                name: 'industry',
                label: '所属行业',
                type: 'select',
                data: [
                    { label: '互联网', value: 'internet' },
                    { label: '制造业', value: 'manufacture' },
                    { label: '零售', value: 'retail' },
                ],
                rules: [{ required: true, message: '请选择行业', trigger: 'change' }],
            },
            {
                name: 'source',
                label: '客户来源',
                type: 'radio',
                data: [
                    { label: '线上推广', value: 'online' },
                    { label: '老客户介绍', value: 'referral' },
                ],
                rules: [{ required: true, message: '请选择来源', trigger: 'change' }],
            },
        ],
        request: () => new Promise<Record<string, string>>((resolve) => {
            setTimeout(() => {
                resolve({
                    industry: 'internet',
                    source: 'referral',
                });
            }, 400);
        }),
    },
    {
        title: '确认提交',
        description: '核对信息后保存',
        options: [
            {
                name: 'level',
                label: '客户等级',
                type: 'select',
                data: [
                    { label: '普通', value: 'normal' },
                    { label: '重点', value: 'important' },
                ],
                rules: [{ required: true, message: '请选择客户等级', trigger: 'change' }],
            },
        ],
    },
];

/**
 * 模拟编辑场景：挂载时回填第一步数据
 */
function request() {
    return new Promise<Record<string, string>>((resolve) => {
        setTimeout(() => {
            resolve({
                name: '杭州某某科技',
                phone: '13800138000',
                level: 'important'
            });
        }, 400);
    });
}

/**
 * 重新加载并回填
 */
async function reload() {
    stepFormRef.value?.reset();
    await stepFormRef.value?.request();
    MessagePlugin.success('已重新加载');
}

/**
 * 保存编辑结果
 */
function handleSubmit(data: Record<string, unknown>) {
    MessagePlugin.success(`保存成功：${JSON.stringify(data)}`);
}
</script>

<template>
    <div class="request-step-form-demo">
        <t-space>
            <t-button theme="primary" @click="reload">重新加载</t-button>
        </t-space>
        <StepForm
            ref="stepFormRef"
            v-model="model"
            v-model:loading="loading"
            class="request-step-form-demo__form"
            :steps="steps"
            :request="request"
            @submit="handleSubmit"
        />
    </div>
</template>

<style scoped lang="scss">
.request-step-form-demo__form {
    margin-top: 16px;
}
</style>
