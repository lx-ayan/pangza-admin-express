import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';
import type { StepFormInstance, StepFormStepOption, StepFormProps } from '@/components/ProComponents/StepForm/types';

/** useStepForm 配置：与 StepFormProps 对齐，steps 等支持响应式 */
export interface UseStepFormOptions {
    /** 步骤配置 */
    steps: MaybeRefOrGetter<StepFormStepOption[]>;
    /** 全局 ProForm 配置 */
    formProps?: MaybeRefOrGetter<StepFormProps['formProps']>;
    /** 初始化异步回填 */
    request?: StepFormProps['request'];
    /** 挂载时不自动 request */
    stopRequest?: MaybeRefOrGetter<boolean | undefined>;
    /** 上一步按钮文案 */
    prevText?: MaybeRefOrGetter<string | undefined>;
    /** 下一步按钮文案 */
    nextText?: MaybeRefOrGetter<string | undefined>;
    /** 提交按钮文案 */
    submitText?: MaybeRefOrGetter<string | undefined>;
    /** 提交前过滤空值 */
    filterEmpty?: MaybeRefOrGetter<boolean | undefined>;
    /** 校验或提交失败回调 */
    fail?: StepFormProps['fail'];
    /** 透传 TDesign Steps */
    stepsProps?: MaybeRefOrGetter<StepFormProps['stepsProps']>;
    /** 是否允许点击步骤条切换 */
    clickable?: MaybeRefOrGetter<boolean | undefined>;
    /** 提交回调（模板侧使用 @submit 绑定） */
    submit?: (data: Record<string, any>) => any;
    /** 初始表单值 */
    modelValue?: Record<string, any>;
}

/**
 * StepForm 配置工厂：收拢 steps / model / current / ref 与常用方法
 */
function useStepForm(config: UseStepFormOptions) {
    const stepFormRef = ref<StepFormInstance>();

    /** 当前步骤，配合 v-model:current */
    const current = ref(0);

    /** 表单数据，配合 v-model */
    const model = ref<Record<string, any>>(config.modelValue ? { ...config.modelValue } : {});

    /** 提交 loading，配合 v-model:loading */
    const loading = ref(false);

    /** 可直接 v-bind 到 StepForm 的 props（不含 v-model） */
    const stepFormProps = computed(() => ({
        steps: toValue(config.steps),
        formProps: toValue(config.formProps),
        request: config.request,
        stopRequest: toValue(config.stopRequest),
        prevText: toValue(config.prevText),
        nextText: toValue(config.nextText),
        submitText: toValue(config.submitText),
        filterEmpty: toValue(config.filterEmpty),
        fail: config.fail,
        stepsProps: toValue(config.stepsProps),
        clickable: toValue(config.clickable),
    }));

    function next() {
        return stepFormRef.value?.next();
    }

    function prev() {
        stepFormRef.value?.prev();
    }

    function submit() {
        return stepFormRef.value?.submit();
    }

    function validate() {
        return stepFormRef.value?.validate();
    }

    function reset() {
        current.value = 0;
        stepFormRef.value?.reset();
    }

    function goTo(index: number) {
        return stepFormRef.value?.goTo(index);
    }

    function setFormItem(key: string, value: any) {
        stepFormRef.value?.setFormItem(key, value);
    }

    function getFormItem(key: string) {
        return stepFormRef.value?.getFormItem(key);
    }

    function getFormValue() {
        return stepFormRef.value?.getFormValue();
    }

    function request() {
        return stepFormRef.value?.request();
    }

    return {
        stepFormRef,
        stepFormProps,
        current,
        model,
        loading,
        next,
        prev,
        submit,
        validate,
        reset,
        goTo,
        setFormItem,
        getFormItem,
        getFormValue,
        request,
    };
}

export default useStepForm;
export { useStepForm };
