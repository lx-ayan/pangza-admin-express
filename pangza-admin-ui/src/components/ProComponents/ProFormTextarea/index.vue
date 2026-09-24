<script setup lang='ts'>
import type { FormItemProps, InputValue, TdTextareaProps } from "tdesign-vue-next";
import { FormItem, Textarea } from 'tdesign-vue-next';
import { getCurrentInstance, h } from 'vue';

export interface ProFormTextareaInstance {
    focus: () => void;
    blur: () => void;
    clear: () => void;
}

const vm = getCurrentInstance();

const props = defineProps<{
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    textareaProps?: TdTextareaProps;
    /** 填充风格：默认灰底，聚焦变白（类似 Arco Design） */
    filled?: boolean;
}>();

const modelValue = defineModel<InputValue>('modelValue');

function getRef(inputRef: any) {
    const expose = inputRef ? {
        focus: inputRef.focus,
        blur: inputRef.blur,
        clear: () => {
            modelValue.value = ''
        }
    } : {};

    vm.exposeProxy = expose;
    vm.exposed = expose;
}

defineOptions({
    name: 'ProFormTextarea',
    inheritAttrs: false
});

defineExpose({} as ProFormTextareaInstance);

</script>
<template>
    <FormItem :class="{ 'pro-form-field--filled': props.filled }" :label="props.label" :rules="props.rules"
        :name="props.name" v-bind="{ ...props.formProps }">
        <template #label>
            <slot name="label"></slot>
        </template>

        <component v-model="modelValue" :ref="getRef"
            :is="h(Textarea, { ...$attrs, ...props.textareaProps, disabled: props.disabled, readonly: props.readonly, placeholder: props.placeholder })">

            <template v-for="item in Object.keys($slots)" #[item]>
                <slot v-if="item != 'label'" :name="item"></slot>
            </template>

            <template #label>
                <slot name="input-label"></slot>
            </template>
        </component>

    </FormItem>
</template>

<style lang="scss" src="../styles/filled-field.scss"></style>
