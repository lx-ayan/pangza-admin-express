<script setup lang="ts">
import RenderColumn from '@/components/public/RenderColumn';
</script>

<template>
    <GrayCard>
        <t-space :size="32">
            <RenderColumn title="请求状态">
                <template #data>
                    <CircleTag color="var(--td-success-color)">成功</CircleTag>
                </template>
            </RenderColumn>
            <RenderColumn title="业务类型">
                <template #data>
                    <span>新增</span>
                </template>
            </RenderColumn>
        </t-space>
    </GrayCard>
</template>
