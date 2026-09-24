<script setup lang='ts'>
import useColor from '@/hooks/components/useColor';

const props = defineProps<{ border?: boolean }>();

const { cardBackgroundColor, borderColor } = useColor();

defineOptions({
    name: 'GrayCard',
    globalComponent: true
})

</script>
<template>
    <div class="gray-card rounded-lg p-4" :class="{ 'border': props.border }" v-bind="$attrs">
        <slot />
    </div>
</template>

<style lang="scss" scoped>
.gray-card {
    background-color: v-bind('cardBackgroundColor');
    border-color: v-bind('borderColor');
}
</style>