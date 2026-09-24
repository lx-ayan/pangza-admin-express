<script setup lang="tsx">
import { computed, ref, useTemplateRef } from 'vue';
import { Input, MessagePlugin, Select } from 'tdesign-vue-next';
import type { ProTableInstance, ProTableOption } from '@/components/ProComponents/ProTable/types';

const proTableRef = useTemplateRef<ProTableInstance>('proTableRef');

const tableData = ref([
    { id: '1', username: '贾明', status: '启用', email: 'jia@demo.com', phone: '13800000001' },
    { id: '2', username: '张三', status: '禁用', email: 'zhang@demo.com', phone: '13800000002' },
    { id: '3', username: '王芳', status: '启用', email: 'wang@demo.com', phone: '13800000003' },
    { id: '4', username: '李雷', status: '启用', email: 'li@demo.com', phone: '13800000004' },
]);

/** 当前处于编辑态的行 key */
const editableRowKeys = ref<string[]>([]);

/** 取消编辑时用于回滚的行快照 */
const editSnapshot = ref<Record<string, any>>({});

const options: ProTableOption[] = [
    {
        key: 'username',
        label: '用户名',
        hideInSearch: true,
        edit: {
            component: Input,
            props: { clearable: true },
            rules: [{ required: true, message: '请输入用户名' }],
            showEditIcon: false,
        },
    },
    {
        key: 'status',
        label: '状态',
        hideInSearch: true,
        edit: {
            component: Select,
            props: {
                clearable: true,
                options: [
                    { label: '启用', value: '启用' },
                    { label: '禁用', value: '禁用' },
                ],
            },
            showEditIcon: false,
        },
    },
    {
        key: 'email',
        label: '邮箱',
        hideInSearch: true,
        edit: {
            component: Input,
            props: { clearable: true },
            showEditIcon: false,
        },
    },
    {
        key: 'phone',
        label: '手机号',
        hideInSearch: true,
        edit: {
            component: Input,
            props: { clearable: true },
            showEditIcon: false,
        },
    },
    {
        key: 'action',
        label: '操作',
        hideInSearch: true,
        tableProps: { width: 160, fixed: 'right' },
    },
];

/**
 * 行编辑过程中同步最新值到 data
 */
function handleRowEdit(context: { rowIndex: number; editedRow: any }) {
    tableData.value.splice(context.rowIndex, 1, { ...context.editedRow });
}

const tableProps = computed(() => ({
    editableRowKeys: editableRowKeys.value,
    onRowEdit: handleRowEdit,
}));

/**
 * 进入行编辑
 */
function handleEdit(row: { id: string }) {
    editSnapshot.value[row.id] = { ...row };
    editableRowKeys.value = [...editableRowKeys.value, row.id];
}

/**
 * 保存当前行：先校验，再退出编辑态
 */
async function handleSave(row: { id: string }) {
    const table = proTableRef.value?.getTableInstance();
    if (!table) {
        return;
    }
    const { result } = await table.validateRowData(row.id);
    // result 有校验错误时不为空数组语义：TDesign 返回错误列表
    if (Array.isArray(result) && result.length > 0) {
        MessagePlugin.warning('请检查填写内容');
        return;
    }
    editableRowKeys.value = editableRowKeys.value.filter((key) => key !== row.id);
    delete editSnapshot.value[row.id];
    MessagePlugin.success('保存成功');
}

/**
 * 取消编辑并回滚数据
 */
function handleCancel(row: { id: string }) {
    const index = tableData.value.findIndex((item) => item.id === row.id);
    const snapshot = editSnapshot.value[row.id];
    if (index > -1 && snapshot) {
        tableData.value.splice(index, 1, { ...snapshot });
    }
    editableRowKeys.value = editableRowKeys.value.filter((key) => key !== row.id);
    delete editSnapshot.value[row.id];
    proTableRef.value?.clearValidate();
}

/**
 * 当前行是否在编辑中
 */
function isEditing(id: string) {
    return editableRowKeys.value.includes(id);
}
</script>

<template>
    <ProTable
        ref="proTableRef"
        v-model:data="tableData"
        :options="options"
        :hide-form="true"
        :hide-page="true"
        row-key="id"
        :table-props="tableProps"
    >
        <template #pro-table-title>点击「编辑」进入行编辑，修改后点「保存」提交</template>
        <template #table-action="{ row }">
            <t-space>
                <template v-if="!isEditing(row.id)">
                    <t-link hover="color" theme="primary" @click="handleEdit(row)">编辑</t-link>
                </template>
                <template v-else>
                    <t-link hover="color" theme="primary" @click="handleSave(row)">保存</t-link>
                    <t-link hover="color" theme="default" @click="handleCancel(row)">取消</t-link>
                </template>
            </t-space>
        </template>
    </ProTable>
</template>
