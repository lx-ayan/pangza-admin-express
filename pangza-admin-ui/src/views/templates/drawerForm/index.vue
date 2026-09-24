<script setup lang='tsx'>
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const visible = ref(false);

const formOptions: ProFormOption[] = [
    {
        name: 'setting',
        label: '自定义组件',
        type: () => <div class="text-base pl-2 border-l-4 border-[var(--td-brand-color)]"> 我是自定义组件 </div>
    },
    {
        name: 'input',
        label: '输入框',
        rules: [
            { required: true, message: '请输入', trigger: 'blur' }
        ]
    },
    {
        name: 'select',
        label: '选择器',
        type: 'select',
        data: [
            { label: '选项1', value: '1' },
            { label: '选项2', value: '2' }
        ]
    },
    {
        name: 'radio',
        label: '单选按钮',
        type: 'radio',
        data: [
            { label: '选项1', value: '1' },
            { label: '选项2', value: '2' }
        ]
    },
    {
        name: 'checkbox',
        label: '复选框',
        type: 'checkbox',
        data: [
            { label: '选项1', value: '1' },
            { label: '选项2', value: '2' }
        ]
    },
    {
        name: 'datePicker',
        label: '日期',
        type: 'datePicker',
        data: [
            { label: '选项1', value: '1' },
            { label: '选项2', value: '2' }
        ]
    },
    {
        name: 'dateRangePicker',
        label: '日期范围',
        type: 'dateRangePicker'
    },
    {
        name: 'textarea',
        label: '文本域',
        type: 'textarea'
    },
    {
        name: 'slotSetting',
        label: '自定义组件'
    },
]

function handleSubmit(data: any) {
    MessagePlugin.success('您提交的数据是：' + JSON.stringify(data));
}

</script>
<template>
    <div>
        <DrawerForm :size="400" header="抽屉表单" v-model:visible="visible" :options="formOptions" :submit="handleSubmit">
            <template #form-slotSetting>
                <div>
                    我是插槽自定义组件
                </div>
            </template>
        </DrawerForm>
        <t-button @click="visible = true">抽屉表单</t-button>
    </div>
</template>