<script setup lang='ts'>
import type { PropType } from 'vue';
import { hasPermission } from '@/utils/security';

defineOptions({
    globalComponent: true,
    name: 'Auth'
})

const props = defineProps({
    permission: {
        type: [String, Array] as PropType<string | string[]>,
        required: true
    },
    needShow: {
        type: Boolean,
        default: false
    }
});

</script>

<template>
    <slot name="default" v-if="props.needShow || hasPermission(props.permission)" :permission="props.permission"
        :hasAuth="hasPermission(props.permission)"></slot>
</template>

<style lang='scss'></style>