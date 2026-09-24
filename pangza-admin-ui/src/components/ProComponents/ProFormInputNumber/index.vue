<script setup lang='ts'>
import type { FormItemProps, InputValue, TdInputAdornmentProps, TdInputNumberProps } from "tdesign-vue-next";
import { FormItem, InputAdornment, InputNumber } from 'tdesign-vue-next';
import { getCurrentInstance, h } from 'vue';

const vm = getCurrentInstance();

const props = defineProps<{
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    inputAdornmentProps?: TdInputAdornmentProps;
    inputNumberProps?: TdInputNumberProps;
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
    name: 'ProFormInputNumber',
    inheritAttrs: false
});

</script>
<template>
    <FormItem
        :class="{ 'pro-form-field--filled': props.filled }"
        :label="props.label"
        :rules="props.rules"
        :name="props.name"
        v-bind="{ ...props.formProps }"
    >
        <template #label>
            <slot name="label"></slot>
        </template>

        <InputAdornment v-bind="{ ...props.inputAdornmentProps }" style="width: 100%">
            <template #prepend>
                <slot name="prepend"></slot>
            </template>

            <template #append>
                <slot name="append"></slot>
            </template>

            <component v-model="modelValue" :ref="getRef"
                :is="h(InputNumber, { ...$attrs, ...props.inputNumberProps, disabled: props.disabled, readonly: props.readonly, placeholder: props.placeholder, theme: props.inputNumberProps?.theme ?? 'normal' })">

                <template v-for="item in Object.keys($slots)" #[item]>
                    <slot v-if="item != 'label'" :name="item"></slot>
                </template>

                <template #label>
                    <slot name="input-label"></slot>
                </template>
            </component>
        </InputAdornment>

    </FormItem>
</template>

<style lang="scss" src="../styles/filled-field.scss"></style>
