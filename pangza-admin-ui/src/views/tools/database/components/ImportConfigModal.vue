<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';
import { IMPORT_CONFIG_EXAMPLE } from '../constants';

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
    confirm: [value: string];
}>();

const configText = ref('');

/** 填充导入示例 */
function handleFillExample() {
    configText.value = JSON.stringify(IMPORT_CONFIG_EXAMPLE, null, 2);
}

function handleConfirm() {
    const value = configText.value.trim();
    if (!value) {
        MessagePlugin.warning('请输入表结构 JSON');
        return;
    }
    emit('confirm', value);
    visible.value = false;
    configText.value = '';
}

function handleClose() {
    configText.value = '';
}
</script>

<template>
    <t-dialog
        v-model:visible="visible"
        header="导入配置"
        width="720px"
        destroy-on-close
        @close="handleClose"
    >
        <div class="import-config-modal__header">
            <span>请输入表结构 JSON:</span>
            <t-button size="small" variant="outline" @click="handleFillExample">导入示例</t-button>
        </div>

        <t-textarea
            v-model="configText"
            placeholder="请输入 JSON 配置"
            :autosize="{ minRows: 14, maxRows: 18 }"
        />

        <template #footer>
            <t-button variant="outline" @click="visible = false">取消</t-button>
            <t-button theme="primary" @click="handleConfirm">确定</t-button>
        </template>
    </t-dialog>
</template>

<style scoped lang="scss">
.import-config-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    color: var(--td-text-color-primary);
}
</style>
