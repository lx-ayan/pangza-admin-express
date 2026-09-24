<script setup lang="ts">
const label = ['直接访问', '邮件营销', '联盟广告', '视频广告', '搜索引擎'];
const data = [335, 310, 234, 135, 1548];
</script>

<template>
    <div class="h-[280px]">
        <PieChart :data="data" :label="label" height="100%" donut />
    </div>
</template>
