<script setup lang='ts'>
import { isNumber } from 'lodash-es';
import { computed, type CSSProperties } from 'vue';


export interface GridProps {
    cols?: number;
    rows?: number;
    gap?: number | { x?: number, y?: number }
}

const props = withDefaults(defineProps<GridProps>(), {
    cols: 24
});

const styleText = computed<CSSProperties>(() => {
    if (props.gap !== undefined) {
        if (isNumber(props.gap)) {
            return {
                gap: props.gap * 0.25 + 'rem'
            };
        } else {
            return {
                columnGap: props.gap.x * 0.25 + 'rem',
                rowGap: props.gap.y * 0.25 + 'rem'
            }
        }
    }
    return {};
})

defineOptions({
    globalComponent: true,
    name: 'Grid'
});
</script>

<template>
    <div :class="` igrid grid grid-cols-[repeat(auto-fit,minmax(200px,auto))_1fr]`" :style="styleText">
        <slot></slot>
    </div>
</template>

<style>
.igrid {
    grid-template-columns: repeat(v-bind('props.cols'), minmax(0, 1fr));
    grid-template-rows: repeat(v-bind('props.rows'), minmax(0, 1fr));
}
</style>