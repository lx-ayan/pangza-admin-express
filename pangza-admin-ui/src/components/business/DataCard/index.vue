<script setup lang='ts'>
import { createNameSpace } from '@/utils/core/css';
import { computed } from 'vue';

const props = defineProps<{
    title?: string;
    bgColor?: string;
    data?: string;
}>();

const { getName, b, be } = createNameSpace('data-card');

const cardBackgroundColor = computed(() => props.bgColor || 'var(--td-bg-color-container)');
</script>
<template>
    <div :class="getName()">
        <div :class="b('header')">
            <div :class="be('header', 'left')">
                <div :class="createNameSpace(be('header', 'left')).e('title')">
                    <span v-if="!$slots['title']">{{ props.title }}</span>
                    <slot v-else name="title"></slot>
                </div>
                <div :class="createNameSpace(be('header', 'left')).e('data')">
                    <span v-if="!$slots['data']">{{ props.data }}</span>
                    <slot v-else name="data"></slot>
                </div>
            </div>

            <div :class="be('header', 'right')">
                <slot name="image">

                </slot>
            </div>
        </div>

        <slot name="footer">

        </slot>
    </div>
</template>

<style lang="scss" scoped>
.data-card {
    background-color: v-bind('cardBackgroundColor');
    @apply rounded-lg px-6 py-4;

    &-header {
        @apply flex items-center justify-between;

        &__left {

            &__title {
                @apply mb-4;
                color: var(--td-text-color-secondary);
            }

            &__data {
                span {
                    @apply text-4xl;
                    color: var(--td-text-color-primary);
                }
            }
        }
    }
}
</style>