<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicSelect from './demos/BasicSelect.vue';
import AliasSelect from './demos/AliasSelect.vue';
import AsyncSelect from './demos/AsyncSelect.vue';
import MultipleSelect from './demos/MultipleSelect.vue';
import CustomSelect from './demos/CustomSelect.vue';
import FilledSelect from './demos/FilledSelect.vue';
import RulesSelect from './demos/RulesSelect.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'alias', title: '字段别名' },
    { id: 'async', title: '异步选项' },
    { id: 'multiple', title: '多选' },
    { id: 'custom', title: '自定义选项' },
    { id: 'filled', title: '填充风格' },
    { id: 'rules', title: '表单校验' },
];

const activeAnchor = ref(anchors[0].id);

/**
 * 滚动到对应示例区块
 */
async function scrollToAnchor(id: string) {
    activeAnchor.value = id;
    await nextTick();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const basicCode = `<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({ status: '' });
const data = [
  { label: '启用', value: '1' },
  { label: '禁用', value: '2' },
];
<\/script>

<template>
  <t-form :data="formData" label-align="top">
    <ProFormSelect
      v-model="formData.status"
      name="status"
      label="状态"
      placeholder="请选择状态"
      :data="data"
    />
  </t-form>
<\/template>`;

const aliasCode = `<script setup lang="tsx">
const data = [
  { label1: '北京', value1: 'bj' },
  { label1: '上海', value1: 'sh' },
];
<\/script>

<template>
  <ProFormSelect
    v-model="formData.city"
    name="city"
    label="城市"
    keyname="label1"
    valuename="value1"
    :data="data"
  />
<\/template>`;

const asyncCode = `<script setup lang="tsx">
function loadData() {
  return Promise.resolve([
    { label: '北京', value: 'bj' },
    { label: '上海', value: 'sh' },
  ]);
}
<\/script>

<template>
  <ProFormSelect
    v-model="formData.city"
    name="city"
    label="城市"
    :data="loadData"
  />
<\/template>`;

const multipleCode = `<script setup lang="tsx">
const formData = reactive({ tags: [] as string[] });
<\/script>

<template>
  <ProFormSelect
    v-model="formData.tags"
    name="tags"
    label="技术栈"
    :data="data"
    :select-props="{ multiple: true, clearable: true }"
  />
<\/template>`;

const customCode = `<script setup lang="tsx">
const data = [
  {
    label: '启用',
    value: '1',
    render: () => <CircleTag color="var(--td-success-color)">启用</CircleTag>,
  },
];
<\/script>

<template>
  <ProFormSelect v-model="formData.status" name="status" label="状态" :data="data">
    <template #option-1="{ option }">
      <CircleTag>{{ option.label }}（插槽）</CircleTag>
    </template>
  </ProFormSelect>
<\/template>`;

const filledCode = `<template>
  <ProFormSelect
    v-model="formData.role"
    filled
    name="role"
    label="角色"
    :data="data"
  />
<\/template>`;

const rulesCode = `<template>
  <t-form :data="formData" @submit="handleSubmit">
    <ProFormSelect
      v-model="formData.status"
      name="status"
      label="状态"
      :data="data"
      :rules="[{ required: true, message: '请选择状态' }]"
    />
    <t-button type="submit">提交</t-button>
  </t-form>
<\/template>`;
</script>

<template>
    <div class="pro-form-item-doc">
        <aside class="pro-form-item-doc__anchor">
            <div class="pro-form-item-doc__anchor-title">本页目录</div>
            <button
                v-for="item in anchors"
                :key="item.id"
                type="button"
                class="pro-form-item-doc__anchor-item"
                :class="{ 'is-active': activeAnchor === item.id }"
                @click="scrollToAnchor(item.id)"
            >
                {{ item.title }}
            </button>
        </aside>

        <div class="pro-form-item-doc__content">
            <div class="pro-form-item-doc__intro">
                <h2 class="pro-form-item-doc__name">ProFormSelect 选择器</h2>
                <p class="pro-form-item-doc__summary">
                    基于 TDesign Select + FormItem 封装。通过 <code>data</code> 配置选项（支持数组 / 同步函数 / 异步函数），
                    默认读取 <code>label</code> / <code>value</code>，也可通过 <code>keyname</code> / <code>valuename</code> 指定别名；
                    <code>select-props</code> 透传 Select；可用 <code>render</code> 或 <code>#option-&#123;value&#125;</code> 自定义选项。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="静态选项"
                detail="配合 t-form 与 v-model 使用；disabled 选项可在 data 中配置。"
                :code="basicCode"
                borderless-card
            >
                <BasicSelect />
            </DemoBlock>

            <DemoBlock
                id="alias"
                title="字段别名"
                description="keyname / valuename 映射自定义字段"
                detail="当选项数据不是 label / value 时，用 keyname、valuename 指定文案字段和值字段，例如 label1、value1。"
                :code="aliasCode"
                :default-expanded="false"
                borderless-card
            >
                <AliasSelect />
            </DemoBlock>

            <DemoBlock
                id="async"
                title="异步选项"
                description="data 传入异步函数"
                detail="data 支持 () => Promise&lt;OptionData[]&gt;，挂载时自动请求并生成选项。"
                :code="asyncCode"
                :default-expanded="false"
                borderless-card
            >
                <AsyncSelect />
            </DemoBlock>

            <DemoBlock
                id="multiple"
                title="多选"
                description="通过 select-props 开启多选"
                detail="透传 multiple、clearable 等 TDesign Select 属性。"
                :code="multipleCode"
                :default-expanded="false"
                borderless-card
            >
                <MultipleSelect />
            </DemoBlock>

            <DemoBlock
                id="custom"
                title="自定义选项"
                description="render 与具名插槽"
                detail="选项可配 render 函数；也可使用 #option-{value} 插槽，插槽优先于 render。"
                :code="customCode"
                :default-expanded="false"
                borderless-card
            >
                <CustomSelect />
            </DemoBlock>

            <DemoBlock
                id="filled"
                title="填充风格"
                description="启用 filled"
                detail="设置 filled 后默认灰底，聚焦变白。"
                :code="filledCode"
                :default-expanded="false"
                borderless-card
            >
                <FilledSelect />
            </DemoBlock>

            <DemoBlock
                id="rules"
                title="表单校验"
                description="配置 rules"
                detail="rules 沿用 TDesign FormRule，需包在 t-form 内并由表单提交触发校验。"
                :code="rulesCode"
                :default-expanded="false"
                borderless-card
            >
                <RulesSelect />
            </DemoBlock>
        </div>
    </div>
</template>

<style scoped lang="scss">
.pro-form-item-doc {
    position: relative;
    display: flex;
    gap: 32px;
    align-items: flex-start;
    max-width: 1280px;
    margin: 0 auto;
    padding: 8px 4px 48px;
}

.pro-form-item-doc__content {
    flex: 1;
    min-width: 0;
    order: 1;
}

.pro-form-item-doc__anchor {
    position: sticky;
    top: 72px;
    flex-shrink: 0;
    order: 2;
    width: 148px;
    padding: 4px 0;
}

.pro-form-item-doc__anchor-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.pro-form-item-doc__anchor-item {
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

.pro-form-item-doc__intro {
    margin-bottom: 32px;
}

.pro-form-item-doc__name {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--td-text-color-primary);
}

.pro-form-item-doc__summary {
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
    .pro-form-item-doc {
        flex-direction: column;
    }

    .pro-form-item-doc__anchor {
        position: static;
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        gap: 4px 8px;
    }

    .pro-form-item-doc__anchor-title {
        width: 100%;
    }

    .pro-form-item-doc__anchor-item {
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
