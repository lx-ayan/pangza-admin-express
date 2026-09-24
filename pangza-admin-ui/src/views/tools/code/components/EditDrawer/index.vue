<script setup lang="ts">
import { createTableConfig, getTableConfig, updateTableConfig } from '@/api/tableConfig';
import { createFieldId } from '@/views/tools/database/constants';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref, watch } from 'vue';
import { createDefaultGenConfig, GEN_TYPE_OPTIONS, TPL_CATEGORY_OPTIONS } from '../../constants';
import type { CodeGenModel } from '../../types';
import {
    syncCodeGenModel,
    toCodeGenField,
    toCodeGenModel,
    toTableConfigPayload,
} from '../../utils/configMapper';
import FieldInfoTab from './FieldInfoTab.vue';

const props = defineProps<{
    id?: string;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
    success: [];
}>();

const activeTab = ref('basic');
const submitting = ref(false);

const formModel = ref<CodeGenModel>({
    tableName: 't_demo',
    tableComment: '示例表',
    genConfig: createDefaultGenConfig(),
    fieldList: [toCodeGenField({ fieldName: 'id', comment: '主键', fieldType: 'varchar', primaryKey: true, id: createFieldId() })],
});

/** 加载详情 */
async function loadDetail(id: string) {
    const data = await getTableConfig(id);
    formModel.value = toCodeGenModel(data);
}

/** 提交保存 */
async function handleSubmit() {
    if (!formModel.value.tableName.trim()) {
        MessagePlugin.warning('请输入表名称');
        return;
    }
    if (!formModel.value.genConfig.entityName.trim()) {
        MessagePlugin.warning('请输入实体类名称');
        return;
    }
    if (!formModel.value.fieldList.length) {
        MessagePlugin.warning('请至少配置一个字段');
        return;
    }

    submitting.value = true;
    const payload = toTableConfigPayload(syncCodeGenModel(formModel.value));

    try {
        if (props.id) {
            await updateTableConfig({ id: props.id, ...payload });
        } else {
            await createTableConfig(payload);
        }
        MessagePlugin.success('保存成功');
        visible.value = false;
        emit('success');
    } catch (error) {
        MessagePlugin.error(String(error));
    } finally {
        submitting.value = false;
    }
}

/** 重置当前表单 */
function handleReset() {
    if (props.id) {
        loadDetail(props.id);
        return;
    }
    formModel.value = {
        tableName: 't_demo',
        tableComment: '示例表',
        genConfig: createDefaultGenConfig(),
        fieldList: [toCodeGenField({ fieldName: 'demo', comment: '示例字段', fieldType: 'varchar', id: createFieldId() })],
    };
}

watch(visible, (value) => {
    if (!value) {
        return;
    }
    activeTab.value = 'basic';
    if (props.id) {
        loadDetail(props.id);
    } else {
        handleReset();
    }
});
</script>

<template>
    <t-drawer
        v-model:visible="visible"
        :header="id ? '编辑代码生成' : '新建代码生成'"
        size="90%"
        :footer="false"
        destroy-on-close
    >
        <t-tabs v-model="activeTab" class="edit-drawer__tabs">
            <t-tab-panel value="basic" label="基本信息">
                <div class="edit-drawer__form-grid">
                    <div class="edit-drawer__form-item">
                        <div class="edit-drawer__label required">表名称</div>
                        <t-input v-model="formModel.tableName" placeholder="请输入表名称" />
                    </div>
                    <div class="edit-drawer__form-item">
                        <div class="edit-drawer__label required">表描述</div>
                        <t-input v-model="formModel.tableComment" placeholder="请输入表描述" />
                    </div>
                    <div class="edit-drawer__form-item">
                        <div class="edit-drawer__label required">实体类名称</div>
                        <t-input v-model="formModel.genConfig.entityName" placeholder="请输入实体类名称" />
                    </div>
                    <div class="edit-drawer__form-item">
                        <div class="edit-drawer__label required">作者</div>
                        <t-input v-model="formModel.genConfig.author" placeholder="请输入作者" />
                    </div>
                    <div class="edit-drawer__form-item edit-drawer__form-item--full">
                        <div class="edit-drawer__label">备注</div>
                        <t-textarea v-model="formModel.genConfig.remark" placeholder="请输入备注" />
                    </div>
                </div>
            </t-tab-panel>

            <t-tab-panel value="fields" label="字段信息">
                <FieldInfoTab v-model="formModel" />
            </t-tab-panel>

            <t-tab-panel value="gen" label="生成信息">
                <div class="edit-drawer__form-grid">
                    <div class="edit-drawer__form-item">
                        <div class="edit-drawer__label required">生成模板</div>
                        <t-select v-model="formModel.genConfig.tplCategory" :options="TPL_CATEGORY_OPTIONS" />
                    </div>
                    <div class="edit-drawer__form-item">
                        <div class="edit-drawer__label">前端类型</div>
                        <t-select :value="'vue3-tdesign'" :options="[{ label: 'Vue3 TDesign 模板', value: 'vue3-tdesign' }]" disabled />
                    </div>
                    <div class="edit-drawer__form-item">
                        <div class="edit-drawer__label required">生成包路径</div>
                        <t-input v-model="formModel.genConfig.packageName" />
                    </div>
                    <div class="edit-drawer__form-item">
                        <div class="edit-drawer__label required">生成模块名</div>
                        <t-input v-model="formModel.genConfig.moduleName" />
                    </div>
                    <div class="edit-drawer__form-item">
                        <div class="edit-drawer__label required">生成业务名</div>
                        <t-input v-model="formModel.genConfig.businessName" />
                    </div>
                    <div class="edit-drawer__form-item">
                        <div class="edit-drawer__label required">生成功能名</div>
                        <t-input v-model="formModel.genConfig.functionName" />
                    </div>
                    <div class="edit-drawer__form-item edit-drawer__form-item--full">
                        <div class="edit-drawer__label">生成代码方式</div>
                        <t-radio-group v-model="formModel.genConfig.genType" :options="GEN_TYPE_OPTIONS" />
                    </div>
                    <div class="edit-drawer__form-item edit-drawer__form-item--full">
                        <t-checkbox v-model="formModel.genConfig.genDetailPage">生成详情页</t-checkbox>
                    </div>
                </div>
            </t-tab-panel>
        </t-tabs>

        <div class="edit-drawer__footer">
            <t-button variant="outline" @click="visible = false">返回</t-button>
            <t-button variant="outline" @click="handleReset">重置</t-button>
            <t-button theme="primary" :loading="submitting" @click="handleSubmit">提交</t-button>
        </div>
    </t-drawer>
</template>

<style scoped lang="scss">
.edit-drawer__tabs {
    min-height: calc(100vh - 180px);
}

.edit-drawer__form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    padding-top: 8px;
}

.edit-drawer__form-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.edit-drawer__form-item--full {
    grid-column: 1 / -1;
}

.edit-drawer__label {
    font-size: 14px;
    color: var(--td-text-color-primary);

    &.required::before {
        margin-right: 4px;
        color: var(--td-error-color);
        content: '*';
    }
}

.edit-drawer__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--td-component-border);
}
</style>
