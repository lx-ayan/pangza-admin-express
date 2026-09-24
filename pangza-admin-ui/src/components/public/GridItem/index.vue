<script setup lang='ts'>
const props = defineProps<{ rowSpan?: number, colSpan?: number }>();

defineOptions({
    globalComponent: true,
    name: 'GridItem'
});
</script>
<template>
    <div class="grid-item" v-bind="$attrs">
        <slot></slot>
    </div>
</template>

<style lang="scss" scoped>
.grid-item {
    grid-row: span v-bind('props.rowSpan') / span v-bind('props.rowSpan');
    grid-column: span v-bind('props.colSpan') / span v-bind('props.colSpan');
}
</style>