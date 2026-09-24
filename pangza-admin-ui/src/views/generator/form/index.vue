<script setup lang='ts'>
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import type { ProTableOption } from '@/components/ProComponents/ProTable/types';
import { Checkbox, Input, MessagePlugin, Select } from 'tdesign-vue-next';
import { MdPreview } from 'md-editor-v3';
import { computed, ref } from 'vue';
import { buidCode } from './util';
import useCopy from '@/hooks/core/useCopy';
import { COMPONENT_DATA } from '@/utils/data/constant';

const formModel = ref<any>({});

const data = [
    { label: '是', value: true },
    { label: '否', value: false },
]

const tableData = ref([]);

const formOption = ref<ProFormOption[]>([
    {
        name: 'hideExtra',
        label: '隐藏操作',
        type: 'radio',
        data,
        gridProps: {
            colSpan: 6
        }
    },
    {
        name: 'hideReset',
        label: '隐藏重置按钮',
        type: 'radio',
        data,
        gridProps: {
            colSpan: 6
        }
    },
    {
        name: 'filterEmpty',
        label: '过滤空值',
        type: 'radio',
        data,
        gridProps: {
            colSpan: 6
        }
    }
]);

const proTableOptions: ProTableOption[] = [
    {
        key: 'name',
        label: '表单名称',
        edit: {
            component: Input,
            keepEditMode: true,
            rules: [
                { required: true, message: '键名必须填写' }
            ]
        }
    },
    {
        key: 'label',
        label: '表单描述',
        edit: {
            component: Input,
            keepEditMode: true,
        }
    },
    {
        key: 'hidden',
        label: '隐藏表单',
        edit: {
            component: Checkbox,
            keepEditMode: true,
        }
    },
    {
        key: 'readonly',
        label: '是否只读',
        edit: {
            component: Checkbox,
            keepEditMode: true,
        }
    },
    {
        key: 'disabled',
        label: '是否禁用',
        edit: {
            component: Checkbox,
            keepEditMode: true,
        }
    },
    {
        key: 'type',
        label: '组件类型',
        edit: {
            component: Select,
            keepEditMode: true,
            props: {
                options: COMPONENT_DATA
            }
        }
    },
    {
        key: 'action',
        label: '操作'
    }
]

function handleAddData() {
    tableData.value.push({
        name: '',
        type: 'input'
    })
}

function handleDelete(index: number) {
    tableData.value.splice(index, 1);
}

function handleCopy() {
    useCopy(code.value).then(() => {
        MessagePlugin.success('复制成功');
    })
}

function request() {
    return {
        total: 0,
        list: []
    }
}

const code = computed(() => "```vue " +
    buidCode(tableData.value, formModel.value)
    + "```");



</script>
<template>
    <div class="flex">
        <div style="width: 70%;">
            <t-card :bordered="false" class="bg-white dark:bg-[#242424] rounded-lg mb-4">
                <ProForm v-model="formModel" :gap="{ x: 8, y: 4 }" hideExtra :options="formOption" />
            </t-card>

            <div class="bg-white dark:bg-[#242424] rounded-lg">
                <div style=" max-height: 520px; overflow: auto;">
                    <ProTable v-model:data="tableData" hideForm hidePage :options="proTableOptions">
                        <template #table-action="{ rowIndex }">
                            <t-link @click="handleDelete(rowIndex)" theme="danger" hover="color">删除</t-link>
                        </template>
                    </ProTable>


                </div>

                <div class="p-4">
                    <t-button @click="handleAddData" variant="outline" block>添加数据</t-button>
                    <t-button class="mt-4" @click="tableData = []" variant="outline" block>清空数据</t-button>
                </div>
            </div>

        </div>

        <div class="flex-1 bg-white dark:bg-[#242424] ml-4 rounded-lg p-4" style="height: 760px;">
            <div style=" height: 650px;">
                <div class="pl-2 border-l-4 border-[var(--td-brand-color)] mb-3 text-base">
                    formProps
                </div>

                <div>
                    {{ formModel }}
                </div>

                <div class="mt-4 pl-2 border-l-4 border-[var(--td-brand-color)] mb-3 text-base">
                    formOptions
                </div>

                <div>
                    <div v-for="option in tableData"
                        :class="`bg-[#f7f8fa] dark:bg-[var(--td-component-border)] py-2 px-4 rounded-sm mb-3`">
                        {{ option }}
                    </div>
                </div>

            </div>
            <DialogButton :dialogProps="{ footer: false }" :buttonProps="{
                variant: 'outline',
                block: true,
            }">
                <template #content>
                    <ProForm v-bind="{ ...formModel }" :options="tableData" :request />
                </template>

                效果预览
            </DialogButton>

            <DialogButton header="代码查看" :dialogProps="{ width: '1000', footer: false }" class="mt-3" :buttonProps="{
                block: true,
            }">

                <template #content>
                    <MdPreview :modelValue="code" />

                    <t-button @click="handleCopy">复制代码</t-button>
                </template>
                代码查看

            </DialogButton>
        </div>
    </div>
</template>