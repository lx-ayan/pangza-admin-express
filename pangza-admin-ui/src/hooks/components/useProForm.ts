import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';
import type { ProFormInstance, ProFormOption, ProFormProps } from '@/components/ProComponents/ProForm/types';

/** useProForm 配置：与 ProFormProps 对齐，options 等支持响应式 */
export interface UseProFormOptions {
    /** 表单项配置 */
    options: MaybeRefOrGetter<ProFormOption[]>;
    /** 栅格列数 */
    cols?: MaybeRefOrGetter<number | undefined>;
    /** 间距 */
    gap?: MaybeRefOrGetter<ProFormProps['gap']>;
    /** 透传 TDesign Form */
    formProps?: MaybeRefOrGetter<ProFormProps['formProps']>;
    /** 提交按钮 props */
    submitButtonProps?: MaybeRefOrGetter<ProFormProps['submitButtonProps']>;
    /** 重置按钮 props */
    resetButtonProps?: MaybeRefOrGetter<ProFormProps['resetButtonProps']>;
    /** 隐藏底部操作区 */
    hideExtra?: MaybeRefOrGetter<boolean | undefined>;
    /** 隐藏重置按钮 */
    hideReset?: MaybeRefOrGetter<boolean | undefined>;
    /** 提交文案 */
    submitText?: MaybeRefOrGetter<string | undefined>;
    /** 重置文案 */
    resetText?: MaybeRefOrGetter<string | undefined>;
    /** 提交前过滤空值 */
    filterEmpty?: MaybeRefOrGetter<boolean | undefined>;
    /** 异步回填 */
    request?: ProFormProps['request'];
    /** 提交回调 */
    submit?: ProFormProps['submit'];
    /** 失败回调 */
    fail?: ProFormProps['fail'];
    /** 初始表单值 */
    modelValue?: Record<string, any>;
    /** 挂载时不自动 request */
    stopRequest?: MaybeRefOrGetter<boolean | undefined>;
    /** 填充风格 */
    filled?: MaybeRefOrGetter<boolean | undefined>;
}

/**
 * ProForm 配置工厂：收拢 options / submit / model / ref 与常用方法，模板 v-bind 展开即可
 */
function useProForm(config: UseProFormOptions) {
    const formRef = ref<ProFormInstance>();

    /** 表单数据，配合 v-model */
    const model = ref<Record<string, any>>(config.modelValue ? { ...config.modelValue } : {});

    /** 提交 loading，配合 v-model:loading */
    const loading = ref(false);

    /** 可直接 v-bind 到 ProForm 的 props（不含 v-model） */
    const formProps = computed(() => ({
        options: toValue(config.options),
        cols: toValue(config.cols),
        gap: toValue(config.gap),
        formProps: toValue(config.formProps),
        submitButtonProps: toValue(config.submitButtonProps),
        resetButtonProps: toValue(config.resetButtonProps),
        hideExtra: toValue(config.hideExtra),
        hideReset: toValue(config.hideReset),
        submitText: toValue(config.submitText),
        resetText: toValue(config.resetText),
        filterEmpty: toValue(config.filterEmpty),
        request: config.request,
        submit: config.submit,
        fail: config.fail,
        stopRequest: toValue(config.stopRequest),
        filled: toValue(config.filled),
    }));

    /** 触发表单提交 */
    function submit() {
        return formRef.value?.submit();
    }

    /** 校验表单 */
    function validate() {
        return formRef.value?.validate();
    }

    /** 重置表单 */
    function reset() {
        formRef.value?.reset();
    }

    /** 设置单个字段值 */
    function setFormItem(key: string, value: any) {
        formRef.value?.setFormItem(key, value);
    }

    /** 获取单个字段值 */
    function getFormItem(key: string) {
        return formRef.value?.getFormItem(key);
    }

    /** 获取全部表单值 */
    function getFormValue() {
        return formRef.value?.getFormValue();
    }

    /** 重新执行 request 回填 */
    function request() {
        formRef.value?.request();
    }

    return {
        formRef,
        formProps,
        model,
        loading,
        submit,
        validate,
        reset,
        setFormItem,
        getFormItem,
        getFormValue,
        request,
    };
}

export default useProForm;
export { useProForm };
