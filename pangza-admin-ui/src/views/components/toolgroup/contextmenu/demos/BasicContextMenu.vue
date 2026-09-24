<script setup lang="tsx">
import IContextMenu from '@/components/public/ContextMenu/index.vue';
import type { ContextMenuOption } from '@/components/public/ContextMenu/types';
import { MessagePlugin } from 'tdesign-vue-next';

const options: ContextMenuOption[] = [
    { content: '刷新', value: 'refresh' },
    { content: '复制', value: 'copy' },
    { content: '删除', value: 'delete' },
];

/**
 * 选中菜单项
 */
function handleChoose(value: string | number) {
    MessagePlugin.info(`选择了：${value}`);
}
</script>

<template>
    <IContextMenu :options="options" @choose="handleChoose">
        <div
            class="flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--td-component-border)] bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
        >
            在此区域右键打开菜单
        </div>
    </IContextMenu>
</template>
