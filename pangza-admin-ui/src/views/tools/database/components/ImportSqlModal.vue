<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';
import { IMPORT_SQL_EXAMPLE } from '../utils/parseCreateTableSql';

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
    /** 确认反向导入，回传 CREATE TABLE SQL 文本 */
    confirm: [value: string];
}>();

const sqlText = ref('');

/** 填充示例 SQL */
function handleFillExample() {
    sqlText.value = IMPORT_SQL_EXAMPLE;
}

/** 确认导入 */
function handleConfirm() {
    const value = sqlText.value.trim();
    if (!value) {
        MessagePlugin.warning('请输入 CREATE TABLE SQL');
        return;
    }
    emit('confirm', value);
    visible.value = false;
    sqlText.value = '';
}

/** 关闭时清空内容 */
function handleClose() {
    sqlText.value = '';
}
</script>

<template>
    <t-dialog
        v-model:visible="visible"
        header="反向导入"
        width="760px"
        destroy-on-close
        @close="handleClose"
    >
        <t-alert theme="info" class="import-sql-modal__alert">
            粘贴 MySQL 建表语句（CREATE TABLE），将自动解析表名、表注释与字段信息。不支持的类型会映射为最接近的类型。
        </t-alert>

        <div class="import-sql-modal__header">
            <span>请输入 CREATE TABLE SQL：</span>
            <t-button size="small" variant="outline" @click="handleFillExample">导入示例</t-button>
        </div>

        <t-textarea
            v-model="sqlText"
            placeholder="CREATE TABLE `demo` ( ... )"
            :autosize="{ minRows: 14, maxRows: 20 }"
        />

        <template #footer>
            <t-button variant="outline" @click="visible = false">取消</t-button>
            <t-button theme="primary" @click="handleConfirm">确定</t-button>
        </template>
    </t-dialog>
</template>

<style scoped lang="scss">
.import-sql-modal__alert {
    margin-bottom: 12px;
}

.import-sql-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    color: var(--td-text-color-primary);
}
</style>
