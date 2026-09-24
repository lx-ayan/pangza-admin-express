<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const visible = defineModel<boolean>('visible', { default: false });

const emit = defineEmits<{
    confirm: [value: string];
}>();

const configText = ref('');

function handleConfirm() {
    const value = configText.value.trim();
    if (!value) {
        MessagePlugin.warning('请输入配置内容');
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
        header="懒人配置"
        width="560px"
        destroy-on-close
        @close="handleClose"
    >
        <t-alert theme="info" class="lazy-config-modal__alert">
            懒人配置，请输入你想要的字段，请以英文逗号隔开。如：username,password,age,header。注意：懒人配置不会生成主键，字段类型都是 varchar 类型
        </t-alert>

        <div class="lazy-config-modal__field">
            <div class="lazy-config-modal__label">配置</div>
            <t-textarea
                v-model="configText"
                placeholder="username,password,age"
                :autosize="{ minRows: 6, maxRows: 10 }"
            />
        </div>

        <template #footer>
            <t-button variant="outline" @click="visible = false">取消</t-button>
            <t-button theme="primary" @click="handleConfirm">确定</t-button>
        </template>
    </t-dialog>
</template>

<style scoped lang="scss">
.lazy-config-modal__alert {
    margin-bottom: 16px;
}

.lazy-config-modal__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.lazy-config-modal__label {
    font-size: 14px;
    color: var(--td-text-color-primary);
}
</style>
