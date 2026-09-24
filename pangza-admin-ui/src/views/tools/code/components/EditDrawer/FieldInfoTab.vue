<script setup lang="ts">
import { BASE_ENTITY_FIELD_PRESETS, createDefaultField, createFieldId } from '@/views/tools/database/constants';
import { MessagePlugin, type DragSortContext, type PrimaryTableCol } from 'tdesign-vue-next';
import {
    HTML_TYPE_OPTIONS,
    JAVA_TYPE_OPTIONS,
    QUERY_TYPE_OPTIONS,
} from '../../constants';
import type { CodeGenField, CodeGenModel } from '../../types';
import { toCodeGenField } from '../../utils/configMapper';

const model = defineModel<CodeGenModel>({ required: true });

const columns: PrimaryTableCol<CodeGenField>[] = [
    { colKey: 'drag', title: '序号', width: 64, align: 'center' },
    { colKey: 'fieldName', title: '字段列名', width: 120 },
    { colKey: 'comment', title: '字段描述', width: 120 },
    { colKey: 'fieldType', title: '物理类型', width: 100 },
    { colKey: 'javaType', title: 'Java类型', width: 100 },
    { colKey: 'javaField', title: 'java属性', width: 120 },
    { colKey: 'isInsert', title: '插入', width: 64, align: 'center' },
    { colKey: 'isEdit', title: '编辑', width: 64, align: 'center' },
    { colKey: 'isList', title: '列表', width: 64, align: 'center' },
    { colKey: 'isQuery', title: '查询', width: 64, align: 'center' },
    { colKey: 'queryType', title: '查询方式', width: 100 },
    { colKey: 'isRequired', title: '必填', width: 64, align: 'center' },
    { colKey: 'htmlType', title: '显示类型', width: 120 },
    { colKey: 'actions', title: '操作', width: 80, align: 'center', fixed: 'right' },
];

/** 导入基础审计字段 */
function handleImportBaseFields() {
    const existingNames = new Set(model.value.fieldList.map((field) => field.fieldName));
    const presets = BASE_ENTITY_FIELD_PRESETS.filter((item) => !existingNames.has(item.fieldName!));
    if (!presets.length) {
        return;
    }
    const fields = presets.map((preset) => toCodeGenField(createDefaultField(preset)));
    model.value.fieldList.push(...fields);
}

/** 添加字段 */
function handleAddField() {
    model.value.fieldList.push(toCodeGenField({
        fieldName: `field_${model.value.fieldList.length + 1}`,
        id: createFieldId(),
    }));
}

/** 删除字段 */
function handleDeleteField(id: string) {
    if (model.value.fieldList.length <= 1) {
        MessagePlugin.warning('至少保留一个字段');
        return;
    }
    model.value.fieldList = model.value.fieldList.filter((field) => field.id !== id);
}

/** 拖拽排序 */
function handleDragSort(ctx: DragSortContext<CodeGenField>) {
    model.value.fieldList = ctx.newData;
}
</script>

<template>
    <div class="field-info-tab">
        <div class="field-info-tab__toolbar">
            <t-button variant="outline" @click="handleImportBaseFields">导入基本数据</t-button>
            <t-button variant="outline" @click="handleAddField">添加字段</t-button>
        </div>

        <div class="field-info-tab__table-wrap">
            <t-table row-key="id" :data="model.fieldList" :columns="columns" size="small" bordered
                drag-sort="row-handler" table-layout="fixed" @drag-sort="handleDragSort">
                <template #drag="{ rowIndex }">
                    <span class="field-info-tab__drag-index">{{ rowIndex + 1 }}</span>
                </template>
                <template #fieldName="{ row }">
                    <t-input v-model="row.fieldName" size="small" />
                </template>
                <template #comment="{ row }">
                    <t-input v-model="row.comment" size="small" />
                </template>
                <template #fieldType="{ row }">
                    <t-input v-model="row.fieldType" size="small" />
                </template>
                <template #javaType="{ row }">
                    <t-select v-model="row.javaType" size="small" :options="JAVA_TYPE_OPTIONS" />
                </template>
                <template #javaField="{ row }">
                    <t-input v-model="row.javaField" size="small" />
                </template>
                <template #isInsert="{ row }">
                    <t-checkbox v-model="row.isInsert" />
                </template>
                <template #isEdit="{ row }">
                    <t-checkbox v-model="row.isEdit" />
                </template>
                <template #isList="{ row }">
                    <t-checkbox v-model="row.isList" />
                </template>
                <template #isQuery="{ row }">
                    <t-checkbox v-model="row.isQuery" />
                </template>
                <template #queryType="{ row }">
                    <t-select v-model="row.queryType" size="small" :options="QUERY_TYPE_OPTIONS" />
                </template>
                <template #isRequired="{ row }">
                    <t-checkbox v-model="row.isRequired" />
                </template>
                <template #htmlType="{ row }">
                    <t-select v-model="row.htmlType" size="small" :options="HTML_TYPE_OPTIONS" />
                </template>
                <template #actions="{ row }">
                    <t-button theme="danger" variant="text" size="small" @click="handleDeleteField(row.id)">
                        删除
                    </t-button>
                </template>
            </t-table>
        </div>
    </div>
</template>

<style scoped lang="scss">
.field-info-tab {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.field-info-tab__toolbar {
    display: flex;
    gap: 12px;
    margin-top: 16px;
}

.field-info-tab__table-wrap {
    overflow: auto;
}

.field-info-tab__drag-index {
    color: var(--td-text-color-placeholder);
}
</style>
