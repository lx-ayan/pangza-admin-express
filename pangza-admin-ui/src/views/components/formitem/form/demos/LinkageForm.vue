<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';

/** 省份 → 城市 */
const cityMap: Record<string, OptionData[]> = {
    bj: [
        { label: '朝阳区', value: 'cy' },
        { label: '海淀区', value: 'hd' },
    ],
    sh: [
        { label: '浦东新区', value: 'pd' },
        { label: '徐汇区', value: 'xh' },
    ],
    gz: [
        { label: '天河区', value: 'th' },
        { label: '越秀区', value: 'yx' },
    ],
};

const formModel = ref<Record<string, any>>({
    type: '1',
});

const options = computed<ProFormOption[]>(() => [
    {
        name: 'type',
        label: '通知类型',
        type: 'radio',
        defaultValue: '1',
        data: [
            { label: '个人通知', value: '1' },
            { label: '系统广播', value: '2' },
        ],
    },
    {
        name: 'userId',
        label: '接收人',
        placeholder: '请输入用户 ID',
        hidden: (model) => model.type !== '1',
        rules: [{ required: true, message: '请输入接收人', trigger: 'blur' }],
    },
    {
        name: 'channel',
        label: '广播渠道',
        type: 'select',
        hidden: (model) => model.type !== '2',
        data: [
            { label: '站内信', value: 'inbox' },
            { label: '邮件', value: 'email' },
            { label: '短信', value: 'sms' },
        ],
        rules: [{ required: true, message: '请选择广播渠道', trigger: 'change' }],
    },
    {
        name: 'province',
        label: '省份',
        type: 'select',
        data: [
            { label: '北京', value: 'bj' },
            { label: '上海', value: 'sh' },
            { label: '广州', value: 'gz' },
        ],
    },
    {
        name: 'city',
        label: '城市',
        type: 'select',
        placeholder: '请先选择省份',
        data: cityMap[formModel.value.province] || [],
        hidden: (model) => !model.province,
    },
]);

/** 切换省份时清空城市 */
watch(
    () => formModel.value.province,
    () => {
        formModel.value.city = undefined;
    },
);

/**
 * 提交表单
 */
function handleSubmit(data: Record<string, unknown>) {
    MessagePlugin.success(`提交成功：${JSON.stringify(data)}`);
}
</script>

<template>
    <ProForm
        v-model="formModel"
        :options="options"
        :gap="{ y: 4 }"
        :form-props="{ labelAlign: 'top' }"
        :submit="handleSubmit"
    />
</template>
