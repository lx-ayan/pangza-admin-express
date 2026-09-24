<script setup lang='ts'>
import type { FormItemProps, TdRadioGroupProps } from 'tdesign-vue-next';
import { FormItem, Radio, RadioGroup } from 'tdesign-vue-next';
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
    data?: OptionData[] | (() => OptionData[]) | (() => Promise<OptionData[]>);
    radioProps?: TdRadioGroupProps;
}>(), {
    keyname: 'label',
    valuename: 'value',
    data: () => []
});

const innerData = ref<ISelectData[]>([]);

const modelValue = defineModel<any>('modelValue');

onMounted(() => {
    buildInnerData();
})

async function buildInnerData() {
    innerData.value = await buildOptionData(props.data, props.keyname, props.valuename);
}

function getRef(radioRef) {
    vm.exposed = radioRef ? {
        reset: buildInnerData,
        clear: () => {
            modelValue.value = '';
        }
    } : {};
}

defineOptions({
    name: 'ProFormRadio',
    inheritAttrs: false
});

watch(() => props.data, buildInnerData, { deep: true });
</script>
<template>
    <FormItem :label="props.label" :rules="props.rules" :name="props.name" v-bind="{ ...props.formProps }">
        <template #label>
            <slot name="label"></slot>
        </template>
        <RadioGroup :disabled="props.disabled" :readonly="props.readonly" :ref="getRef"
            v-bind="{ ...$attrs, ...props.radioProps }" v-model="modelValue">
            <Radio :key="item.value" :label="item.label" v-for="item in innerData"
                :disabled="props.disabled || item.disabled" :value="item.value">
                <template v-if="!$slots['option-' + item.value]">
                    <component v-if="item.render" :is="item.render(item)"></component>
                    <template v-else>
                        {{ item.label }}
                    </template>
                </template>
                <slot v-else :name="`option-${item.value}`" :option="item">

                </slot>
            </Radio>
        </RadioGroup>
    </FormItem>
</template>