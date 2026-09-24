<script setup lang="ts">
const label = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const data = [120, 200, 150, 80, 70, 110, 130];
</script>

<template>
    <div class="h-[280px]">
        <BarChart :data="data" :label="label" height="100%" />
    </div>
</template>
