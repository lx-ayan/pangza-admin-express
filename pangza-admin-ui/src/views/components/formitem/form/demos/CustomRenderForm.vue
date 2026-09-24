<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';

const options: ProFormOption[] = [
    {
        name: 'title',
        label: '自定义标题',
        type: () => (
            <div class="text-base pl-2 border-l-4 border-[var(--td-brand-color)]">
                使用 type 函数渲染自定义内容
            </div>
        ),
        gridProps: { colSpan: 24 },
    },
    {
        name: 'username',
        label: '用户名',
        rules: [{ required: true, message: '请输入用户名' }],
        gridProps: { colSpan: 12 },
    },
    {
        name: 'slotField',
        label: '插槽字段',
        gridProps: { colSpan: 12 },
    },
    {
        name: 'renderField',
        label: 'Render 字段',
        gridProps: { colSpan: 24 },
        render: (model, key) => (
            <div class="w-full">
                <t-input
                    modelValue={model[key]}
                    placeholder="通过 render 函数自定义输入"
                    onChange={(val: string) => {
                        model[key] = val;
                    }}
                />
                <div class="mt-2 text-xs text-[var(--td-text-color-placeholder)]">
                    当前值：{model[key] || '-'}
                </div>
            </div>
        ),
    },
];

/**
 * 提交自定义渲染表单
 */
function handleSubmit(data: Record<string, any>) {
    MessagePlugin.success('提交成功：' + JSON.stringify(data));
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
        >
            <template #form-slotField>
                <t-input placeholder="通过 #form-字段名 插槽自定义" />
            </template>
        </ProForm>
    </div>
</template>
