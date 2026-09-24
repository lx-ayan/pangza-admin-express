import type { ProFormOption, ProFormProps } from '../ProForm/types';
import type { TdStepsProps } from 'tdesign-vue-next';

/** 单步配置 */
export interface StepFormStepOption {
    /** 步骤标题，展示在 Steps 与表单区 */
    title: string;
    /** 步骤描述 */
    description?: string;
    /** 当前步骤表单项 */
    options: ProFormOption[];
    /** 当前步骤 ProForm 配置，会覆盖全局 formProps */
    formProps?: Optional<ProFormProps, 'options'>;
    /** 进入该步骤时的异步回填 */
    request?: ProFormProps['request'];
}

export interface StepFormProps {
    /** 步骤配置 */
    steps: StepFormStepOption[];
    /** 全局 ProForm 配置 */
    formProps?: Optional<ProFormProps, 'options'>;
    /** 初始化异步回填 */
    request?: ProFormProps['request'];
    /** 挂载时不自动 request */
    stopRequest?: boolean;
    /** 上一步按钮文案 */
    prevText?: string;
    /** 下一步按钮文案 */
    nextText?: string;
    /** 提交按钮文案 */
    submitText?: string;
    /** 提交前过滤空值 */
    filterEmpty?: boolean;
    /** 校验或提交失败回调 */
    fail?: ProFormProps['fail'];
    /** 透传 TDesign Steps */
    stepsProps?: TdStepsProps;
    /** 是否允许点击步骤条切换（前进时会校验当前步） */
    clickable?: boolean;
}

export interface StepFormInstance {
    next: () => Promise<boolean>;
    prev: () => void;
    submit: () => Promise<void>;
    validate: () => Promise<any>;
    reset: () => void;
    request: () => Promise<void>;
    setFormItem: (key: string, value: any) => void;
    getFormItem: (key: string) => any;
    getFormValue: () => any;
    goTo: (index: number) => Promise<boolean>;
}
