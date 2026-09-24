<script setup lang="tsx">
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';

/**
 * 危险操作确认
 */
function handleConfirm(instance: DialogInstance) {
    MessagePlugin.success('已删除');
    instance.destroy();
}
</script>

<template>
    <t-space>
        <DialogButton
            theme="danger"
            header="删除确认"
            content="删除后不可恢复，是否继续？"
            :dialog-props="{ theme: 'danger' }"
            @confirm="handleConfirm"
        >
            危险操作
        </DialogButton>

        <DialogButton
            variant="outline"
            theme="primary"
            header="自定义内容"
            content=""
            @confirm="(ins) => ins.hide()"
        >
            <template #content>
                <div class="text-[var(--td-text-color-secondary)]">
                    可通过 <code>#content</code> 插槽自定义弹窗内容。
                </div>
            </template>
            插槽内容
        </DialogButton>
    </t-space>
</template>
