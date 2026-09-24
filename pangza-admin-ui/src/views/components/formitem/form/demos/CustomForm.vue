<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';

const options: ProFormOption[] = [
    {
        name: 'setting',
        label: '自定义组件',
        type: () => (
            <div class="pl-2 text-base border-l-4 border-[var(--td-brand-color)]">
                我是 type 函数自定义组件
            </div>
        ),
    },
    {
        name: 'slotSetting',
        label: '插槽自定义',
    },
    {
        name: 'nickname',
        label: '昵称',
        rules: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
    },
    {
        name: 'render',
        label: 'render 渲染',
        render: (model, key, option) => (
            <div>
                <div class="mb-2 text-[var(--td-text-color-secondary)] text-sm">
                    当前值：{String(model[key] ?? '')}
                </div>
                <t-input
                    disabled={option.disabled}
                    value={model[key]}
                    onChange={(val: string) => {
                        model[key] = val;
                    }}
                    placeholder="通过 render 绑定输入"
                />
            </div>
        ),
    },
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
        :options="options"
        :gap="{ y: 4 }"
        :form-props="{ labelAlign: 'top' }"
        :submit="handleSubmit"
    >
        <template #form-slotSetting>
            <div class="text-[var(--td-text-color-secondary)]">
                我是 #form-slotSetting 插槽自定义内容
            </div>
        </template>
    </ProForm>
</template>
