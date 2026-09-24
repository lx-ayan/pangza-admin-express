<script setup lang="tsx">
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';

/**
 * 链接确认
 */
function handleConfirm(instance: DialogInstance) {
    MessagePlugin.success('已确认');
    instance.destroy();
}
</script>

<template>
    <t-space>
        <DialogLink
            theme="primary"
            hover="color"
            header="系统提示"
            content="是否继续当前操作？"
            @confirm="handleConfirm"
        >
            查看详情
        </DialogLink>

        <DialogLink
            theme="danger"
            hover="color"
            header="系统提示"
            content="是否删除当前数据？"
            @confirm="handleConfirm"
        >
            删除
        </DialogLink>
    </t-space>
</template>
