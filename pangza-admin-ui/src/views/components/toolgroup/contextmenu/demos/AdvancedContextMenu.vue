<script setup lang="tsx">
import IContextMenu from '@/components/public/ContextMenu/index.vue';
import type { ContextMenuOption } from '@/components/public/ContextMenu/types';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const locked = ref(true);

const options: ContextMenuOption[] = [
    { content: '查看详情', value: 'view' },
    {
        content: () => <span class="text-[var(--td-brand-color)]">自定义渲染项</span>,
        value: 'custom',
    },
    {
        content: '编辑（禁用）',
        value: 'edit',
        disabled: true,
    },
    {
        content: '仅解锁后显示',
        value: 'secret',
        hidden: () => locked.value,
    },
];

/**
 * 选中菜单项
 */
function handleChoose(value: string | number) {
    MessagePlugin.info(`选择了：${value}`);
}
</script>

<template>
    <div class="space-y-3">
        <t-checkbox v-model="locked">隐藏「仅解锁后显示」项</t-checkbox>
        <IContextMenu :options="options" @choose="handleChoose">
            <div
                class="flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--td-component-border)] bg-[var(--td-bg-color-secondarycontainer)] text-[var(--td-text-color-secondary)]"
            >
                右键查看禁用 / 隐藏 / 自定义内容
            </div>
        </IContextMenu>
    </div>
</template>
