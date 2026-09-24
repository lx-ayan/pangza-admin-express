<script setup lang="tsx">
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';

/**
 * 确认后关闭弹窗
 */
function handleConfirm(instance: DialogInstance) {
    MessagePlugin.success('已确认');
    instance.hide();
}

/**
 * 取消回调
 */
function handleCancel() {
    MessagePlugin.info('已取消');
}
</script>

<template>
    <t-space>
        <DialogButton
            header="系统提示"
            content="确认执行该操作吗？"
            @confirm="handleConfirm"
            @cancel="handleCancel"
        >
            基础确认
        </DialogButton>
    </t-space>
</template>
