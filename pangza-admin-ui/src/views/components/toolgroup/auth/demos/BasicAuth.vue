<script setup lang="ts">
/**
 * 无权限时默认不渲染内容；文档页用 needShow 强制展示，便于查看插槽参数
 */
</script>

<template>
    <Auth permission="system:user:list" need-show>
        <template #default="{ hasAuth, permission }">
            <t-alert
                theme="info"
                :message="`permission=${permission}，hasAuth=${hasAuth}`"
            />
            <div class="mt-3 text-sm text-[var(--td-text-color-secondary)]">
                有权限时渲染默认插槽；无权限且 needShow=false 时不渲染。
            </div>
        </template>
    </Auth>
</template>
