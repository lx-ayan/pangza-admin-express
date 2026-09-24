<script setup lang='ts'>
import { getCssVar } from '@/utils/core/css';


</script>
<template>
    <t-space>
        <CircleTag>主要</CircleTag>
        <CircleTag :color="getCssVar('--td-success-color')">成功</CircleTag>
        <CircleTag :color="getCssVar('--td-warning-color')">失败</CircleTag>
        <CircleTag :color="getCssVar('--td-error-color')">警告</CircleTag>
        <CircleTag :color="getCssVar('--td-component-border')">取消</CircleTag>
        <CircleTag animation>闪烁</CircleTag>
    </t-space>
</template>