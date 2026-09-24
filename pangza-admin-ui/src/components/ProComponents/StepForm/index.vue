<script setup lang='ts'>
import { Button, Space, Steps, StepItem, type TdStepsProps } from 'tdesign-vue-next';
import type { ProFormInstance, ProFormProps } from '../ProForm/types';
import type { StepFormStepOption } from './types';
import { cloneDeep } from 'lodash-es';
import ObjectUtil from '@/utils/clz/ObjectUtil';
import { computed, nextTick, onMounted, useTemplateRef, watch } from 'vue';

const props = withDefaults(defineProps<{
    steps: StepFormStepOption[];
    request?: ProFormProps['request'];
    formProps?: Optional<ProFormProps, 'options'>;
    stopRequest?: boolean;
    prevText?: string;
    nextText?: string;
    submitText?: string;
    filterEmpty?: boolean;
    fail?: ProFormProps['fail'];
    stepsProps?: TdStepsProps;
    clickable?: boolean;
}>(), {
    steps: () => [],
    formProps: () => ({
        formProps: {
            labelAlign: 'top',
        },
    }),
    prevText: '上一步',
    nextText: '下一步',
    submitText: '提交',
    clickable: false,
});

const emits = defineEmits<{
    (e: 'submit', data: Record<string, any>): void;
    (e: 'change', current: number): void;
}>();

const current = defineModel<number>('current', { default: 0 });
const model = defineModel<Record<string, any>>('modelValue', { default: () => ({}) });
const loading = defineModel<boolean>('loading', { default: false });

const proFormRef = useTemplateRef<ProFormInstance>('proFormRef');

const isFirstStep = computed(() => current.value <= 0);
const isLastStep = computed(() => current.value >= props.steps.length - 1);

const currentStep = computed(() => props.steps[current.value]);

const mergedFormProps = computed(() => {
    const stepFormProps = currentStep.value?.formProps || {};
    return {
        ...props.formProps,
        ...stepFormProps,
        formProps: {
            ...props.formProps?.formProps,
            ...stepFormProps.formProps,
        },
    };
});

const formGap = computed(() => ({
    y: mergedFormProps.value?.formProps?.labelAlign === 'top' ? 4 : 6,
    x: 4,
}));

/**
 * 过滤空值，与 ProForm 行为保持一致
 */
function filterEmptyData(data: Record<string, any>) {
    const formData: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
        if (!ObjectUtil.isEmpty(value)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                formData[key] = filterEmptyData(value as Record<string, any>);
            } else {
                formData[key] = value;
            }
        }
    });
    return formData;
}

/**
 * 执行全局或单步 request 回填
 */
async function runRequest(targetIndex = current.value) {
    const step = props.steps[targetIndex];
    if (step?.request) {
        const data = await step.request();
        if (data) {
            model.value = { ...model.value, ...cloneDeep(data) };
        }
        return;
    }
    if (targetIndex === 0 && props.request) {
        const data = await props.request();
        if (data) {
            model.value = cloneDeep(data);
        }
    }
}

/**
 * 校验当前步骤表单
 */
async function validateCurrentStep() {
    const result = await proFormRef.value?.validate();
    if (result !== true) {
        props.fail?.(result);
        return false;
    }
    return true;
}

/**
 * 跳转到指定步骤，前进时校验当前步
 */
async function goTo(index: number) {
    if (!props.steps.length) {
        return false;
    }
    const target = Math.max(0, Math.min(index, props.steps.length - 1));
    if (target === current.value) {
        return true;
    }
    if (target > current.value) {
        const valid = await validateCurrentStep();
        if (!valid) {
            return false;
        }
    }
    current.value = target;
    emits('change', current.value);
    await nextTick();
    await runRequest(target);
    return true;
}

async function next() {
    if (isLastStep.value) {
        return false;
    }
    return goTo(current.value + 1);
}

function prev() {
    if (isFirstStep.value) {
        return;
    }
    current.value -= 1;
    emits('change', current.value);
}

async function submit() {
    const valid = await validateCurrentStep();
    if (!valid) {
        return;
    }
    try {
        loading.value = true;
        let formData = cloneDeep(model.value);
        if (props.filterEmpty) {
            formData = filterEmptyData(formData);
        }
        emits('submit', formData);
    } catch (error) {
        props.fail?.(error);
    } finally {
        loading.value = false;
    }
}

function reset() {
    current.value = 0;
    model.value = {};
    proFormRef.value?.reset();
}

async function handleNextClick() {
    if (isLastStep.value) {
        await submit();
        return;
    }
    await next();
}

async function handleStepsChange(value: string | number) {
    if (!props.clickable) {
        return;
    }
    await goTo(Number(value));
}

onMounted(async () => {
    if (!props.stopRequest) {
        await runRequest(0);
    }
});

watch(current, (value) => {
    emits('change', value);
});

defineOptions({
    name: 'StepForm',
});

defineExpose({
    next,
    prev,
    submit,
    goTo,
    validate: () => proFormRef.value?.validate(),
    reset,
    request: () => runRequest(current.value),
    setFormItem: (key: string, value: any) => {
        proFormRef.value?.setFormItem(key, value);
    },
    getFormItem: (key: string) => proFormRef.value?.getFormItem(key),
    getFormValue: () => proFormRef.value?.getFormValue(),
});
</script>

<template>
    <div class="step-form">
        <Steps
            v-bind="props.stepsProps"
            :current="current"
            :readonly="!props.clickable"
            class="step-form__steps"
            @change="handleStepsChange"
        >
            <StepItem
                v-for="(step, index) in props.steps"
                :key="`${step.title}-${index}`"
                :title="step.title"
                :content="step.description"
            />
        </Steps>

        <div v-if="currentStep" class="step-form__panel">
            <div class="step-form__header">
                <div class="step-form__title">{{ currentStep.title }}</div>
                <div v-if="currentStep.description" class="step-form__description">
                    {{ currentStep.description }}
                </div>
            </div>

            <ProForm
                :key="current"
                ref="proFormRef"
                v-model="model"
                v-model:loading="loading"
                stop-request
                hide-extra
                :options="currentStep.options"
                :gap="formGap"
                v-bind="mergedFormProps"
            >
                <template v-for="key in Object.keys($slots)" #[key]="args">
                    <slot :name="key" v-bind="args" />
                </template>
            </ProForm>
        </div>

        <div class="step-form__footer">
            <slot
                name="footer"
                :current="current"
                :loading="loading"
                :is-first-step="isFirstStep"
                :is-last-step="isLastStep"
                :prev="prev"
                :next="handleNextClick"
                :submit="submit"
            >
                <Space>
                    <Button
                        v-if="!isFirstStep"
                        variant="outline"
                        @click="prev"
                    >
                        {{ props.prevText }}
                    </Button>
                    <Button
                        theme="primary"
                        :loading="loading"
                        @click="handleNextClick"
                    >
                        {{ isLastStep ? props.submitText : props.nextText }}
                    </Button>
                </Space>
            </slot>
        </div>
    </div>
</template>

<style scoped lang="scss">
.step-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.step-form__steps {
    width: 100%;
}

.step-form__panel {
    padding: 4px;
}

.step-form__header {
    margin-bottom: 16px;
}

.step-form__title {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--td-text-color-primary);
}

.step-form__description {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--td-text-color-secondary);
}

.step-form__footer {
    display: flex;
    justify-content: flex-end;
}
</style>
