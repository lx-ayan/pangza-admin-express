<script setup lang="tsx">
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';

/**
 * 模拟异步确认：完成后手动关闭弹窗
 */
async function handleConfirm(instance: DialogInstance) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    MessagePlugin.success('操作成功');
    instance.destroy();
}
</script>

<template>
    <DialogLink
        theme="primary"
        hover="color"
        header="异步确认"
        content="点击确认后模拟异步请求，完成后关闭弹窗。"
        @confirm="handleConfirm"
    >
        异步确认
    </DialogLink>
</template>
