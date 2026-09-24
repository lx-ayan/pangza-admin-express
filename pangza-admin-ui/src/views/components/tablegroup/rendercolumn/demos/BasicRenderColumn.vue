<script setup lang="ts">
import RenderColumn from '@/components/public/RenderColumn';
</script>

<template>
    <t-space :size="32">
        <RenderColumn title="操作人" data="张三" />
        <RenderColumn title="操作时间" data="2026-07-28 10:00:00" />
        <RenderColumn title="金额" data="¥128.00" align="right" />
    </t-space>
</template>
