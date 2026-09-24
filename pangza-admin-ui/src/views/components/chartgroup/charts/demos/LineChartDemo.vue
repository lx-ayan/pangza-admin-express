<script setup lang="ts">
const label = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const data = [82, 93, 90, 94, 120, 110, 130];
</script>

<template>
    <div class="h-[280px]">
        <LineChart :data="data" :label="label" height="100%" :smooth="true" :show-area="true" />
    </div>
</template>
