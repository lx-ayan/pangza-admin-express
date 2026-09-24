<script setup lang="tsx">
import {
    deleteTableConfig,
    getTableConfig,
    getTableConfigPage,
} from '@/api/tableConfig';
import { DialogLink, ProTable, type ProTableInstance, type ProTableOption } from '@/components/ProComponents';
import type { TableConfig } from '@/types/api/tableConfig';
import { parseFieldConfigPackage } from '@/views/tools/database/utils/tableConfigMapper';
import { DialogPlugin, MessagePlugin, type DialogInstance } from 'tdesign-vue-next';
import { ref, useTemplateRef } from 'vue';
import EditDrawer from './components/EditDrawer/index.vue';
import PreviewModal from './components/PreviewModal/index.vue';
import type { CodeGenModel } from './types';
import { parseGenConfig, syncCodeGenModel, toCodeGenModel } from './utils/configMapper';
import { generateCodeFiles } from './utils/generateCodeFiles';
import { downloadCodeZip } from './utils/downloadCodeZip';

const tableRef = useTemplateRef<ProTableInstance>('tableRef');

const selectData = ref({ values: [] as string[] });
const editId = ref<Nullable<string>>(null);
const editVisible = ref(false);
const previewVisible = ref(false);
const previewModel = ref<CodeGenModel | null>(null);

const proTableOptions = ref<ProTableOption<TableConfig>[]>([
    {
        key: 'tableName',
        label: '表名称',
    },
    {
        key: 'tableComment',
        label: '表描述',
    },
    {
        key: 'entityName',
        label: '实体',
        hideInSearch: true,
        render: (row) => {
            const { genConfig } = parseFieldConfigPackage(row.fieldConfig);
            const config = parseGenConfig(genConfig, row.tableName, row.tableComment);
            return <span>{config.entityName}</span>;
        },
    },
    {
        key: 'createTime',
        label: '创建时间',
        type: 'dateRangePicker',
        hideInSearch: false,
        tableProps: { width: 180 },
    },
    {
        key: 'updateTime',
        label: '更新时间',
        hideInSearch: true,
        tableProps: { width: 180 },
    },
    {
        key: 'actions',
        label: '操作',
        hideInSearch: true,
        tableProps: { width: 280, fixed: 'right' },
    },
]);

/** 分页请求 */
function request(data: any) {
    const param = { ...data };
    if (data.form?.createTime?.length === 2) {
        const [beginDate, endDate] = data.form.createTime;
        param.form = {
            ...data.form,
            beginDate,
            endDate,
            createTime: undefined,
        };
    }
    return getTableConfigPage(param);
}

function handleOpenEdit(id: string) {
    editId.value = id;
    editVisible.value = true;
}

function handleOpenPreview(row: TableConfig) {
    previewModel.value = syncCodeGenModel(toCodeGenModel(row));
    previewVisible.value = true;
}

function handleDeleteConfirm(id: string, instance: DialogInstance) {
    deleteTableConfig(id).then(() => {
        MessagePlugin.success('删除成功');
        instance.destroy();
        tableRef.value?.reset();
    }).catch((error) => {
        MessagePlugin.error(String(error));
    });
}

function handleBatchDelete() {
    const ids = selectData.value.values as string[];
    if (!ids.length) {
        MessagePlugin.warning('请选择要删除的数据');
        return;
    }
    const instance = DialogPlugin.confirm({
        header: '系统提示',
        body: `确认删除选中的 ${ids.length} 条数据吗？`,
        onConfirm: async () => {
            await Promise.all(ids.map((id) => deleteTableConfig(id)));
            MessagePlugin.success('删除成功');
            selectData.value.values = [];
            tableRef.value?.reset();
            instance.destroy();
        },
        onCancel: () => {
            instance.destroy();
        },
        onClose: () => {
            instance.destroy();
        },
    });
}

function handleEditSuccess() {
    tableRef.value?.reset();
}

async function handleGenerateCode(row: TableConfig) {
    const model = syncCodeGenModel(toCodeGenModel(row));
    const files = generateCodeFiles(model);
    await downloadCodeZip(model, files);
    MessagePlugin.success('代码已下载');
}

async function handleBatchGenerate() {
    const ids = selectData.value.values as string[];
    if (!ids.length) {
        MessagePlugin.warning('请选择要生成的数据');
        return;
    }
    const data = await getTableConfig(ids[0]);
    await handleGenerateCode(data);
}
</script>

<template>
    <div class="code-gen-page">
        <ProTable
            ref="tableRef"
            v-model:select-data="selectData"
            select-able
            row-key="id"
            :options="proTableOptions"
            :request="request"
        >
            <template #pro-table-title>
                <t-space>
                    <t-button variant="outline" @click="handleBatchGenerate">生成</t-button>
                    <t-button
                        variant="outline"
                        theme="danger"
                        :disabled="!selectData.values.length"
                        @click="handleBatchDelete"
                    >
                        删除
                    </t-button>
                </t-space>
            </template>

            <template #table-actions="{ row }">
                <t-space>
                    <t-link theme="primary" hover="color" @click="handleOpenPreview(row)">预览</t-link>
                    <t-link theme="primary" hover="color" @click="handleOpenEdit(row.id)">编辑</t-link>
                    <t-link theme="primary" hover="color" @click="handleGenerateCode(row)">生成代码</t-link>
                    <DialogLink
                        theme="danger"
                        hover="color"
                        header="系统提示"
                        content="确认删除该表配置吗？"
                        @confirm="(instance: DialogInstance) => handleDeleteConfirm(row.id, instance)"
                    >
                        删除
                    </DialogLink>
                </t-space>
            </template>
        </ProTable>

        <EditDrawer :id="editId || undefined" v-model:visible="editVisible" @success="handleEditSuccess" />
        <PreviewModal v-model:visible="previewVisible" :model="previewModel" />
    </div>
</template>

<style scoped lang="scss">
.code-gen-page {
    min-height: 100%;
}
</style>
