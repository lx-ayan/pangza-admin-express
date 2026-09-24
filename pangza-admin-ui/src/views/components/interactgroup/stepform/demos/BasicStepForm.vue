<script setup lang="ts">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import type { StepFormStepOption } from '@/components/ProComponents/StepForm/types';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const model = ref<Record<string, unknown>>({});

const steps: StepFormStepOption[] = [
    {
        title: '基本信息',
        description: '填写客户名称与联系方式',
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
        description: '补充行业、来源与备注',
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
                    { label: '线下活动', value: 'offline' },
                ],
                rules: [{ required: true, message: '请选择来源', trigger: 'change' }],
            },
            {
                name: 'remark',
                label: '备注',
                type: 'textarea',
                placeholder: '可填写补充说明',
            },
        ],
    },
    {
        title: '确认提交',
        description: '核对信息并完成创建',
        options: [
            {
                name: 'level',
                label: '客户等级',
                type: 'select',
                data: [
                    { label: '普通', value: 'normal' },
                    { label: '重点', value: 'important' },
                    { label: '战略', value: 'strategic' },
                ],
                rules: [{ required: true, message: '请选择客户等级', trigger: 'change' }],
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
    />
</template>
