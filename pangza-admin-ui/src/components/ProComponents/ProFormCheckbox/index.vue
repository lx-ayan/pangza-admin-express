<script setup lang='ts'>
import type { FormItemProps, TdCheckboxGroupProps } from 'tdesign-vue-next';
import { Checkbox, CheckboxGroup, FormItem, } from 'tdesign-vue-next';
import { getCurrentInstance, onMounted, ref, watch } from 'vue';
import { buildOptionData } from '@/utils/components';
const vm = getCurrentInstance();

const props = withDefaults(defineProps<{
    name: string;
    disabled?: boolean;
    readonly?: boolean;
    label?: FormItemProps['label'];
    rules?: FormItemProps['rules'];
    formProps?: FormItemProps;
    keyname?: string;
    valuename?: string;
    data?: OptionDataProps;
    checkboxProps?: TdCheckboxGroupProps;
}>(), {
    keyname: 'label',
    valuename: 'value',
    data: () => []
});

const innerData = ref<ISelectData[]>([]);

const modelValue = defineModel<any>('modelValue', { default: () => [] });

onMounted(() => {
    buildInnerData();
})

async function buildInnerData() {
    innerData.value = await buildOptionData(props.data, props.keyname, props.valuename);
}

function getRef(checkProps) {
    vm.exposed = checkProps ? {
        reset: buildInnerData,
        clear: () => {
            modelValue.value = [];
        }
    } : {};
}

defineOptions({
    name: 'ProFormCheckbox',
    inheritAttrs: false
});

watch(() => props.data, buildInnerData, { deep: true });

</script>
<template>
    <FormItem :label="props.label" :rules="props.rules" :name="props.name" v-bind="{ ...props.formProps }">
        <template #label>
            <slot name="label"></slot>
        </template>
        <CheckboxGroup :disabled="props.disabled" :readonly="props.readonly" :ref="getRef"
            v-bind="{ ...$attrs, ...props.checkboxProps }" v-model="modelValue">
            <Checkbox :key="item.value" :label="item.label" v-for="item in innerData" :value="item.value"
                :disabled="props.disabled || item.disabled" :readonly="props.readonly">

                <template v-if="!$slots['option-' + item.value]">
                    <component v-if="item.render" :is="item.render(item)"></component>
                    <template v-else>
                        {{ item.label }}
                    </template>
                </template>
                <slot v-else :name="`option-${item.value}`" :option="item">

                </slot>
            </Checkbox>
        </CheckboxGroup>
    </FormItem>
</template>