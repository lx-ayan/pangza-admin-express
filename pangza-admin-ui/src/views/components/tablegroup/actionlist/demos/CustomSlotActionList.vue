<script setup lang="tsx">
const options = [
    {
        value: 'theme',
        label: '外观主题',
        description: '使用插槽自定义标题与描述',
        icon: 'unused',
    },
    {
        value: 'lang',
        label: '语言',
        description: '系统显示语言',
        icon: () => <MyIcon name="Languages" size={20} />,
    },
];
</script>

<template>
    <ActionList :options="options" :border="false">
        <template #icon-theme>
            <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--td-brand-color-light)]"
            >
                <MyIcon name="Palette" :size="16" color="var(--td-brand-color)" />
            </div>
        </template>

        <template #label-theme>
            <span class="font-medium text-[var(--td-brand-color)]">外观主题（插槽）</span>
        </template>

        <template #description-theme>
            <span>可通过 #icon / #label / #description 插槽覆盖对应内容</span>
        </template>

        <template #action-theme>
            <t-tag size="small" variant="light">跟随系统</t-tag>
        </template>

        <template #action-lang>
            <t-tag size="small" variant="outline">简体中文</t-tag>
        </template>
    </ActionList>
</template>
