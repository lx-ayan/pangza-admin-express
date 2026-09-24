<script setup lang='ts'>
import { createNameSpace } from '@/utils/core/css';
import { computed } from 'vue';

const componentName = 'circle-tag';

const name = createNameSpace(componentName);

const props = withDefaults(defineProps<{
    color?: string;
    size?: SizeEnum;
    animation?: boolean;
    width?: string;
    height?: string;
}>(), {
    color: '#3553FF',
    size: 'base',
    animation: false
});

const size = computed<string>(() => {
    switch (props.size) {
        case 'small':
            return 'h-[4px] w-[4px]';
        default:
        case 'base':
            return 'h-[6px] w-[6px]';
        case 'large':
            return 'h-[12px] w-[12px]';
    }
});

defineOptions({
    globalComponent: true,
    name: 'CircleTag'
});

</script>
<template>
    <div :class="componentName">
        <div :class="`${name.e('circle')} ${size} ${props.animation ? 'animate-pulse' : ''}`"
            :style="{ background: props.color, width: props.width, height: props.height }">
        </div>
        <div :class="name.e('box')">
            <slot />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.circle-tag {
    @apply flex items-center;

    &__circle {
        @apply mr-1.5 rounded-full;
    }
}
</style>