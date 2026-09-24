<script setup lang='ts'>
import { useTemplateRef } from 'vue';
import type { ContextMenuOption } from './types';
import { isFunction } from 'lodash-es';

const props = defineProps<{
    options: ContextMenuOption[];
}>();

const emits = defineEmits<{
    (e: 'choose', value: typeof props.options[number]['value'], option: ContextMenuOption): void;
}>();

const contextmenu = useTemplateRef('contextmenu');

function handleClick(option: ContextMenuOption) {
    emits('choose', option.value, option);
}

defineOptions({
    name: 'IContextMenu',
    globalComponent: true
})

</script>
<template>
    <div class="h-full w-full" v-bind="$attrs" v-contextmenu:contextmenu="contextmenu">
        <slot />
        <Transition name="context-menu" mode="out-in">
            <v-contextmenu ref="contextmenu">
                <template v-for="option in props.options" :key="option.value">
                    <v-contextmenu-item :disabled="option.disabled" @click="() => handleClick(option)"
                        v-if="isFunction(option.hidden) ? option.hidden() != true : option.hidden != true">
                        <span v-if="typeof option.content === 'string'">{{ option.content }}</span>
                        <component v-else :is="option.content" />
                    </v-contextmenu-item>
                </template>
            </v-contextmenu>
        </Transition>
    </div>
</template>

<style>
.v-contextmenu-inner .v-contextmenu-item {
    color: var(--td-text-color-primary);
    text-align: left;
    padding: 0;
    border-radius: 2px;
    padding: 8px 12px;
    min-width: 200px;
}

.v-contextmenu-item--hover {
    background-color: var(--td-bg-color-component) !important;
}

.v-contextmenu {
    background-color: var(--td-bg-color-container) !important;
    border: none !important;
    padding: 4px;
}

/* 动画样式 */
.context-menu-enter-active,
.context-menu-leave-active {
    transition: all .2s ease-out;
}

.context-menu-enter-from,
.context-menu-leave-to {
    opacity: 0;
    transform: scale(0.9);
}

.context-menu-enter-to,
.context-menu-leave-from {
    opacity: 1;
    transform: scale(1);
}
</style>