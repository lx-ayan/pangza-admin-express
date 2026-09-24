<script setup lang="ts">
const label = ['访问', '点击', '咨询', '订单', '成交'];
const data = [100, 80, 60, 40, 20];
</script>

<template>
    <div class="h-[280px]">
        <FunnelChart :data="data" :label="label" height="100%" />
    </div>
</template>
