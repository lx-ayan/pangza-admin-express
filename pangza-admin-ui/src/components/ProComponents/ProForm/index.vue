<script setup lang='ts'>
import { computed, h, onMounted, ref, unref, useTemplateRef, watch } from "vue";
import ProFormInput from '@/components/ProComponents/ProFormInput/index.vue';
import ProFormSelect from '@/components/ProComponents/ProFormSelect/index.vue';
import ProFormRadio from '@/components/ProComponents/ProFormRadio/index.vue';
import ProFormCheckbox from '@/components/ProComponents/ProFormCheckbox/index.vue';
import ProFormDatePicker from '@/components/ProComponents/ProFormDatePicker/index.vue';
import ProFormTextarea from '@/components/ProComponents/ProFormTextarea/index.vue';
import ProFormDateRangePicker from '@/components/ProComponents/ProFormDateRangePicker/index.vue';
import ProFormInputNumber from '@/components/ProComponents/ProFormInputNumber/index.vue';
import Grid from '@/components/public/Grid/index.vue';
import GridItem from '@/components/public/GridItem/index.vue';
import { createNameSpace } from "@/utils/core/css";
import { Form, Button, type TdButtonProps, Space, type FormInstanceFunctions, type TdFormProps } from "tdesign-vue-next";
import { cloneDeep, isFunction, isObject, isString } from "lodash-es";
import ObjectUtil from "@/utils/clz/ObjectUtil";
import type { ProFormOption } from "./types";

const COMPONENT_NAME = 'pro-form';

const nameSpace = createNameSpace(COMPONENT_NAME);

const COMPONENT_MAP = {
    'input': ProFormInput,
    'select': ProFormSelect,
    'radio': ProFormRadio,
    'checkbox': ProFormCheckbox,
    'datePicker': ProFormDatePicker,
    'textarea': ProFormTextarea,
    'dateRangePicker': ProFormDateRangePicker,
    'inputNumber': ProFormInputNumber
}

const props = defineProps<{
    options: ProFormOption[];
    cols?: number;
    gap?: { x?: number, y?: number };
    formProps?: TdFormProps;
    submitButtonProps?: TdButtonProps;
    resetButtonProps?: TdButtonProps;
    hideExtra?: boolean;
    hideReset?: boolean;
    submitText?: string;
    resetText?: string;
    filterEmpty?: boolean;
    request?: () => (any | Promise<any>);
    submit?: (data: any) => any;
    fail?: (e: any) => any;
    modelValue?: Record<string, any>;
    stopRequest?: boolean;
    /** 整表启用填充风格：默认灰底，聚焦变白（类似 Arco Design） */
    filled?: boolean;
}>();

const emits = defineEmits(['update:modelValue']);

const formRef = useTemplateRef<FormInstanceFunctions>('formRef');

const loading = defineModel<boolean>('loading', {
    default: false
});

const innerModelValue = ref<any>(props.modelValue || {});

const options = computed(() => {
    return filterOptions();
})

onMounted(() => {
    if (props.stopRequest) {
        buildModelValue();
        return;
    }
    init();
});

function init() {
    if (props.request) {
        buildRequestValue();
    } else {
        buildModelValue();
    }
}

async function buildRequestValue() {
    const result = await props.request();
    innerModelValue.value = cloneDeep(result ? result : buildModelValue());
}

async function buildModelValue() {
    options.value.forEach(item => {
        if (item.defaultValue !== undefined) {
            setNestedValue(innerModelValue.value, item.name, item.defaultValue);
        }
    })
}

function getNestedValue(obj: Record<string, any>, key: string) {

    return key.split('.').reduce((current, part) => {
        return current && typeof current === 'object' ? current[part] : undefined;
    }, obj);
}

function setNestedValue(obj: Record<string, any>, key: string, value: any) {
    const parts = key.split('.');
    const lastPart = parts.pop();

    if (!lastPart) return;

    let current = obj;
    parts.forEach(part => {
        if (ObjectUtil.isEmpty(current[part]) || typeof current[part] !== 'object') {
            current[part] = {};
        }
        current = current[part];
    });
    current[lastPart] = value;
    innerModelValue.value = { ...innerModelValue.value };
}

async function handleSubmit() {
    try {
        loading.value = true;
        const result = await formRef.value.validate();
        if (result === true) {
            if (props.submit) {
                let formData = cloneDeep(innerModelValue.value);
                if (props.filterEmpty) {
                    formData = filterEmptyData(innerModelValue.value);
                }
                await props.submit(formData);
            }
        } else {
            props.fail && props.fail(result);
            loading.value = false;
        }
    } catch (error) {
        props.fail && props.fail(error)
    } finally {
        loading.value = false;
    }
}

function filterEmptyData(data: Record<string, any>) {
    let formData = {};
    Object.entries(data).forEach(([key, value]) => {
        if (!ObjectUtil.isEmpty(value)) {
            if (isObject(value)) {
                formData[key] = filterEmptyData(value);
            } else {
                formData[key] = value;
            }
        }
    })
    return formData;
}

function reset() {
    formRef.value?.reset();
    innerModelValue.value = {};
}

function filterOptions() {
    const result: ProFormOption[] = [];
    props.options.forEach(item => {
        const hasIt = result.filter(r => r.name === item.name).length > 0;
        if (!hasIt) {
            result.push(item);
        }
    });

    return result;
}

defineExpose({
    submit: () => {
        return formRef.value.submit();
    },
    validate: () => {
        return formRef.value.validate();
    },
    reset,
    setFormItem: (key: string, value: any) => {
        setNestedValue(innerModelValue.value, key, value);
    },
    getFormItem: (key: string) => {
        return getNestedValue(innerModelValue.value, key)
    },
    getFormValue: () => {
        return cloneDeep(innerModelValue.value);
    },
    request: init
})

defineOptions({
    name: 'ProForm',
})

watch(() => props.modelValue, (newVal) => {
    innerModelValue.value = newVal;
}, { deep: true });

watch(innerModelValue, (value) => {
    emits('update:modelValue', value);
}, { deep: true })

</script>
<template>
    <div class='pro-form'>
        <Form @submit="handleSubmit" ref="formRef" :data="innerModelValue" :class="nameSpace.e('box')"
            v-bind="{ ...props.formProps }">
            <Grid :gap="{ y: props.gap?.y || 6, x: props.gap?.x || 0 }">

                <template v-for="item in options">
                    <GridItem
                        v-if="isFunction(item.hidden) ? item.hidden(unref(innerModelValue), item.name) != true : item.hidden != true"
                        :class="nameSpace.e('item')" :colSpan="item.gridProps?.colSpan || 24">

                        <template v-if="$slots[`form-${item.name}`]">
                            <slot :name="`form-${item.name}`" :data="unref(innerModelValue)" :key="item.name"
                                :option="item">
                            </slot>
                        </template>

                        <template v-else>
                            <component v-if="!item.render" :model-value="getNestedValue(innerModelValue, item.name)"
                                :placeholder="item.placeholder || (item.props as any)?.placeholder"
                                :data="item.data || []"
                                @update:model-value="(value: any) => setNestedValue(innerModelValue, item.name, value)"
                                :label="item.label" :name="item.name" :disabled="item.disabled"
                                :readonly="item.readonly" :rules="item.rules" :filled="props.filled"
                                :is="h(isString(item.type || 'input') ? COMPONENT_MAP[item.type as string || 'input'] :
                                    item.type as any, { filled: props.filled, ...item.props }, { ...item.slots })">
                            </component>

                            <component v-else :is="() => item.render(unref(innerModelValue), item.name, item)">
                            </component>
                        </template>
                    </GridItem>
                </template>


                <template v-if="!props.hideExtra">
                    <GridItem v-if="!$slots['extra']" class="pro-form__action" :colSpan="24">
                        <Space style="float: right;">
                            <Button :loading="loading" type="submit" v-bind="{ ...props.submitButtonProps }">{{
                                props.submitText || '提交'
                            }}</Button>
                            <Button v-if="!props.hideReset" type="reset" @click="reset"
                                v-bind="{ variant: 'outline', ...props.resetButtonProps }">{{ props.resetText || '重置'
                                }}</Button>
                        </Space>

                    </GridItem>
                    <slot v-else name="extra" :loading="loading"></slot>
                </template>
            </Grid>
        </Form>
    </div>
</template>