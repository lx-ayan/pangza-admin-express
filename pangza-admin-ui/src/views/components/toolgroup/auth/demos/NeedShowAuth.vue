<script setup lang="ts">
/**
 * needShow=false：无权限时隐藏按钮（文档环境通常无该权限，按钮不可见）
 * needShow=true：始终渲染，可通过 hasAuth 自行控制交互
 */
</script>

<template>
    <t-space>
        <Auth permission="demo:never:exists">
            <t-button theme="primary">无权限时隐藏</t-button>
        </Auth>

        <Auth permission="demo:never:exists" need-show>
            <template #default="{ hasAuth }">
                <t-button theme="primary" :disabled="!hasAuth">
                    无权限时禁用（hasAuth={{ hasAuth }}）
                </t-button>
            </template>
        </Auth>
    </t-space>
</template>
