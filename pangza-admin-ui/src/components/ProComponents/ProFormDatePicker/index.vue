<script setup lang='ts'>
import { DatePicker, FormItem, type FormItemProps, type TdDatePickerProps } from 'tdesign-vue-next';
import { getCurrentInstance } from 'vue';

const props = defineProps<{
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    datePickerProps?: TdDatePickerProps;
    /** 填充风格：默认灰底，聚焦变白（类似 Arco Design） */
    filled?: boolean;
}>();

const modelValue = defineModel<string>();

const vm = getCurrentInstance();

function getRef(datePicerRef) {
    vm.exposed = datePicerRef ? {
        clear: () => {
            modelValue.value = '';
        }
    } : {};
}

defineOptions({
    name: 'ProFormDatePicker',
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

        <DatePicker :ref="getRef" v-model="modelValue" v-bind="{ ...$attrs, ...props.datePickerProps }"
            :disabled="props.disabled" :readonly="props.readonly">

            <template v-for="item in Object.keys($slots)" #[item]>
                <slot v-if="item != 'label'" :name="item"></slot>
            </template>

            <template #label>
                <slot name="input-label"></slot>
            </template>
        </DatePicker>
    </FormItem>

</template>

<style lang="scss" src="../styles/filled-field.scss"></style>
