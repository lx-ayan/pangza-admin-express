<script setup lang='ts'>
import { useSlots } from 'vue';

const props = defineProps<{
    title?: string;
    description?: string;
    otherMessage?: string;
}>();

const slots = useSlots();

defineOptions({
    name: 'Success',
    globalComponent: true
})

</script>
<template>
    <div class="flex flex-col items-center justify-center p-6">
        <div class="text-center max-w-md">

            <div
                class="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center mx-auto justify-center mb-6">
                <svg class="w-12 h-12 text-green-500 dark:text-green-400" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>

            <h1 v-if="props.title" class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ props.title }}</h1>

            <p v-if="props.description" class="text-gray-500 dark:text-gray-300 mb-8 text-sm">
                {{ props.description }}
            </p>

            <div v-if="props.otherMessage" class="bg-gray-50 dark:bg-white/10 rounded-lg p-4 mb-8">
                <p class="text-gray-600 dark:text-white/60 text-sm">
                    <span v-if="!slots['otherMessage']">{{ props.otherMessage }}</span>
                    <slot name="otherMessage"></slot>
                </p>

            </div>

            <div v-if="slots['action']">
                <slot name="action"></slot>
            </div>
        </div>
    </div>
</template>