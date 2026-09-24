<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicForm from './demos/BasicForm.vue';
import FieldsForm from './demos/FieldsForm.vue';
import RulesForm from './demos/RulesForm.vue';
import LinkageForm from './demos/LinkageForm.vue';
import FilledForm from './demos/FilledForm.vue';
import CustomForm from './demos/CustomForm.vue';
import RequestForm from './demos/RequestForm.vue';
import HookForm from './demos/HookForm.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础表单' },
    { id: 'fields', title: '表单控件' },
    { id: 'rules', title: '表单校验' },
    { id: 'linkage', title: '表单联动' },
    { id: 'filled', title: '填充风格' },
    { id: 'custom', title: '自定义渲染' },
    { id: 'request', title: '异步回填' },
    { id: 'hook', title: '使用 Hook' },
];

const activeAnchor = ref(anchors[0].id);

/**
 * 滚动到对应示例区块
 */
async function scrollToAnchor(id: string) {
    activeAnchor.value = id;
    await nextTick();
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** 基础表单示例代码 */
const basicCode = `<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';

const options: ProFormOption[] = [
  {
    name: 'username',
    label: '用户名',
    rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  },
  {
    name: 'email',
    label: '邮箱',
    placeholder: '请输入邮箱',
  },
];

function handleSubmit(data: Record<string, unknown>) {
  MessagePlugin.success(\`提交成功：\${JSON.stringify(data)}\`);
}
<\/script>

<template>
  <ProForm
    :options="options"
    :gap="{ y: 4 }"
    :form-props="{ labelAlign: 'top' }"
    :submit="handleSubmit"
  />
<\/template>`;

const fieldsCode = `<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';

const half = { colSpan: 12 };

const options: ProFormOption[] = [
  { name: 'input', label: '输入框', gridProps: half },
  {
    name: 'select',
    label: '选择器',
    type: 'select',
    gridProps: half,
    data: [
      { label: '选项1', value: '1' },
      { label: '选项2', value: '2' },
    ],
  },
  { name: 'radio', label: '单选', type: 'radio', gridProps: half, data: [/* ... */] },
  { name: 'checkbox', label: '复选', type: 'checkbox', gridProps: half, data: [/* ... */] },
  { name: 'datePicker', label: '日期', type: 'datePicker', gridProps: half },
  { name: 'dateRangePicker', label: '日期范围', type: 'dateRangePicker', gridProps: half },
  { name: 'inputNumber', label: '数字', type: 'inputNumber', gridProps: half },
  { name: 'textarea', label: '文本域', type: 'textarea' },
];
<\/script>

<template>
  <ProForm :options="options" :gap="{ x: 4, y: 4 }" :submit="handleSubmit" />
<\/template>`;

const rulesCode = `<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';

const options: ProFormOption[] = [
  {
    name: 'username',
    label: '用户名',
    rules: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 12, message: '长度为 2-12 个字符', trigger: 'blur' },
    ],
  },
  {
    name: 'phone',
    label: '手机号',
    rules: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1\\d{10}$/, message: '手机号格式不正确', trigger: 'blur' },
    ],
  },
];
<\/script>

<template>
  <ProForm :options="options" :submit="handleSubmit" />
<\/template>`;

const linkageCode = `<script setup lang="tsx">
import { computed, ref, watch } from 'vue';
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';

const cityMap: Record<string, OptionData[]> = {
  bj: [{ label: '朝阳区', value: 'cy' }, { label: '海淀区', value: 'hd' }],
  sh: [{ label: '浦东新区', value: 'pd' }, { label: '徐汇区', value: 'xh' }],
};

const formModel = ref<Record<string, any>>({ type: '1' });

const options = computed<ProFormOption[]>(() => [
  {
    name: 'type',
    label: '通知类型',
    type: 'radio',
    defaultValue: '1',
    data: [
      { label: '个人通知', value: '1' },
      { label: '系统广播', value: '2' },
    ],
  },
  {
    name: 'userId',
    label: '接收人',
    // 返回 true 时隐藏该字段
    hidden: (model) => model.type !== '1',
  },
  {
    name: 'channel',
    label: '广播渠道',
    type: 'select',
    hidden: (model) => model.type !== '2',
    data: [/* ... */],
  },
  {
    name: 'province',
    label: '省份',
    type: 'select',
    data: [
      { label: '北京', value: 'bj' },
      { label: '上海', value: 'sh' },
    ],
  },
  {
    name: 'city',
    label: '城市',
    type: 'select',
    data: cityMap[formModel.value.province] || [],
    hidden: (model) => !model.province,
  },
]);

watch(() => formModel.value.province, () => {
  formModel.value.city = undefined;
});
<\/script>

<template>
  <ProForm v-model="formModel" :options="options" :submit="handleSubmit" />
<\/template>`;

const filledCode = `<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';

const options: ProFormOption[] = [
  { name: 'username', label: '用户名' },
  { name: 'role', label: '角色', type: 'select', data: [/* ... */] },
  { name: 'deadline', label: '截止日期', type: 'datePicker' },
  { name: 'remark', label: '备注', type: 'textarea' },
];
<\/script>

<template>
  <!-- filled：默认灰底，聚焦变白 -->
  <ProForm filled :options="options" :submit="handleSubmit" />
<\/template>`;

const customCode = `<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';

const options: ProFormOption[] = [
  {
    name: 'setting',
    label: '自定义组件',
    type: () => <div>我是 type 函数自定义组件</div>,
  },
  { name: 'slotSetting', label: '插槽自定义' },
  {
    name: 'render',
    label: 'render 渲染',
    render: (model, key, option) => (
      <t-input
        value={model[key]}
        onChange={(val: string) => { model[key] = val; }}
      />
    ),
  },
];
<\/script>

<template>
  <ProForm :options="options" :submit="handleSubmit">
    <template #form-slotSetting>
      <div>我是插槽自定义内容</div>
    </template>
  </ProForm>
<\/template>`;

const requestCode = `<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';

const options: ProFormOption[] = [
  { name: 'username', label: '用户名' },
  { name: 'email', label: '邮箱' },
];

function request() {
  return Promise.resolve({
    username: '贾明',
    email: 'demo@example.com',
  });
}
<\/script>

<template>
  <ProForm
    :options="options"
    :request="request"
    submit-text="保存"
    :submit="handleSubmit"
  />
<\/template>`;

const hookCode = `<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { useProForm } from '@/hooks/components/useProForm';
import { MessagePlugin } from 'tdesign-vue-next';

const options: ProFormOption[] = [
  {
    name: 'username',
    label: '用户名',
    rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  },
  { name: 'email', label: '邮箱' },
];

function handleSubmit(data: Record<string, unknown>) {
  MessagePlugin.success(\`提交成功：\${JSON.stringify(data)}\`);
}

const { formRef, formProps, model, loading } = useProForm({
  options,
  gap: { y: 4 },
  formProps: { labelAlign: 'top' },
  submit: handleSubmit,
});
<\/script>

<template>
  <ProForm ref="formRef" v-bind="formProps" v-model="model" v-model:loading="loading" />
<\/template>`;
</script>

<template>
    <div class="pro-form-doc">
        <aside class="pro-form-doc__anchor">
            <div class="pro-form-doc__anchor-title">本页目录</div>
            <button
                v-for="item in anchors"
                :key="item.id"
                type="button"
                class="pro-form-doc__anchor-item"
                :class="{ 'is-active': activeAnchor === item.id }"
                @click="scrollToAnchor(item.id)"
            >
                {{ item.title }}
            </button>
        </aside>

        <div class="pro-form-doc__content">
            <div class="pro-form-doc__intro">
                <h2 class="pro-form-doc__name">ProForm 高级表单</h2>
                <p class="pro-form-doc__summary">
                    基于 TDesign Form 封装，通过配置 <code>options</code> 快速生成表单项，支持校验、联动、布局、填充风格、自定义渲染与异步回填；也可用 <code>useProForm</code> 简化写法。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础表单"
                description="最简单的用法"
                detail="配置 options 与 submit，即可生成带提交 / 重置的表单。"
                :code="basicCode"
                borderless-card
            >
                <BasicForm />
            </DemoBlock>

            <DemoBlock
                id="fields"
                title="表单控件"
                description="内置常用控件类型"
                detail="支持 input / select / radio / checkbox / datePicker / dateRangePicker / inputNumber / textarea，可通过 gridProps.colSpan、gap 控制栅格布局。"
                :code="fieldsCode"
                :default-expanded="false"
                borderless-card
            >
                <FieldsForm />
            </DemoBlock>

            <DemoBlock
                id="rules"
                title="表单校验"
                description="配置 rules 做字段校验"
                detail="规则沿用 TDesign FormRule，支持 required、min/max、pattern 等；提交前自动校验。"
                :code="rulesCode"
                :default-expanded="false"
                borderless-card
            >
                <RulesForm />
            </DemoBlock>

            <DemoBlock
                id="linkage"
                title="表单联动"
                description="字段显隐与级联选项"
                detail="通过 hidden(formModel) 控制字段显隐；配合 v-model 与 computed options 可实现省市区等级联选择。"
                :code="linkageCode"
                :default-expanded="false"
                borderless-card
            >
                <LinkageForm />
            </DemoBlock>

            <DemoBlock
                id="filled"
                title="填充风格"
                description="启用 filled 填充样式"
                detail="设置 filled 后，输入类控件默认灰底，聚焦时变为白色，适合信息密度较高的表单场景。"
                :code="filledCode"
                :default-expanded="false"
                borderless-card
            >
                <FilledForm />
            </DemoBlock>

            <DemoBlock
                id="custom"
                title="自定义渲染"
                description="type 函数 / 插槽 / render"
                detail="type 可传函数返回自定义节点；字段名对应 #form-{name} 插槽；也可用 render(model, key, option) 完全自定义。"
                :code="customCode"
                :default-expanded="false"
                borderless-card
            >
                <CustomForm />
            </DemoBlock>

            <DemoBlock
                id="request"
                title="异步回填"
                description="通过 request 加载初始值"
                detail="传入 request 后，组件挂载时会请求数据并回填到表单；适合编辑场景。"
                :code="requestCode"
                :default-expanded="false"
                borderless-card
            >
                <RequestForm />
            </DemoBlock>

            <DemoBlock
                id="hook"
                title="使用 Hook"
                description="useProForm 配置工厂"
                detail="用 useProForm 收拢 options、submit、model、loading 与 validate 等方法，模板通过 v-bind=&quot;formProps&quot; 展开，与直接传 props 等价。"
                :code="hookCode"
                :default-expanded="false"
                borderless-card
            >
                <HookForm />
            </DemoBlock>
        </div>
    </div>
</template>

<style scoped lang="scss">
.pro-form-doc {
    position: relative;
    display: flex;
    gap: 32px;
    align-items: flex-start;
    max-width: 1280px;
    margin: 0 auto;
    padding: 8px 4px 48px;
}

.pro-form-doc__content {
    flex: 1;
    min-width: 0;
    order: 1;
}

.pro-form-doc__anchor {
    position: sticky;
    top: 72px;
    flex-shrink: 0;
    order: 2;
    width: 148px;
    padding: 4px 0;
}

.pro-form-doc__anchor-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.pro-form-doc__anchor-item {
    display: block;
    width: 100%;
    padding: 8px 10px;
    border: 0;
    border-left: 2px solid transparent;
    border-radius: 0;
    background: transparent;
    color: var(--td-text-color-secondary);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease;

    &:hover {
        color: var(--td-brand-color);
    }

    &.is-active {
        border-left-color: var(--td-brand-color);
        color: var(--td-brand-color);
        font-weight: 500;
    }
}

.pro-form-doc__intro {
    margin-bottom: 32px;
}

.pro-form-doc__name {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--td-text-color-primary);
}

.pro-form-doc__summary {
    margin: 12px 0 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--td-text-color-secondary);

    code {
        padding: 1px 6px;
        border-radius: 4px;
        background: var(--td-bg-color-secondarycontainer);
        color: var(--td-brand-color);
        font-size: 13px;
    }
}

@media (max-width: 960px) {
    .pro-form-doc {
        flex-direction: column;
    }

    .pro-form-doc__anchor {
        position: static;
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        gap: 4px 8px;
    }

    .pro-form-doc__anchor-title {
        width: 100%;
    }

    .pro-form-doc__anchor-item {
        width: auto;
        border-left: 0;
        border-radius: 6px;
        background: var(--td-bg-color-secondarycontainer);

        &.is-active {
            background: var(--td-brand-color-light);
        }
    }
}
</style>
