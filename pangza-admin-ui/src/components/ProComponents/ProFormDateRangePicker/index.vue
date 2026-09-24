<script setup lang='ts'>
import { DateRangePicker, type FormItemProps, type TdDateRangePickerProps, FormItem } from 'tdesign-vue-next';
import { getCurrentInstance } from 'vue';

const props = defineProps<{
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    datePickerProps?: TdDateRangePickerProps;
}>();

const modelValue = defineModel<string[]>({
    default: () => []
});

const vm = getCurrentInstance();

function getRef(datePicerRef) {
    vm.exposed = datePicerRef ? {
        clear: () => {
            modelValue.value = [];
        }
    } : {};
}

defineOptions({
    name: 'ProFormDateRangePicker',
    inheritAttrs: false
});
</script>

<template>
    <div>
        <FormItem :label="props.label" :rules="props.rules" :name="props.name" v-bind="{ ...props.formProps }">
            <template #label>
                <slot name="label"></slot>
            </template>
            <DateRangePicker :ref="getRef" v-model="modelValue" v-bind="{ ...$attrs, ...props.datePickerProps }"
                :disabled="props.disabled" :readonly="props.readonly">

                <template v-for="item in Object.keys($slots)" #[item]>
                    <slot v-if="item != 'label'" :name="item"></slot>
                </template>

                <template #label>
                    <slot name="input-label"></slot>
                </template>
            </DateRangePicker>
        </FormItem>
    </div>
</template>