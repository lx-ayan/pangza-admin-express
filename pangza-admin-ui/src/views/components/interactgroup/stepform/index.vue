<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicStepForm from './demos/BasicStepForm.vue';
import RequestStepForm from './demos/RequestStepForm.vue';
import CustomStepForm from './demos/CustomStepForm.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'request', title: '异步回填' },
    { id: 'custom', title: '自定义渲染' },
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

const basicCode = `<script setup lang="ts">
import type { StepFormStepOption } from '@/components/ProComponents/StepForm/types';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const model = ref<Record<string, unknown>>({});

const steps: StepFormStepOption[] = [
  {
    title: '基本信息',
    description: '填写客户名称与联系方式',
    options: [
      {
        name: 'name',
        label: '客户名称',
        rules: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
      },
      {
        name: 'phone',
        label: '联系电话',
        rules: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
      },
    ],
  },
  {
    title: '业务信息',
    description: '补充行业、来源与备注',
    options: [
      {
        name: 'industry',
        label: '所属行业',
        type: 'select',
        data: [
          { label: '互联网', value: 'internet' },
          { label: '制造业', value: 'manufacture' },
          { label: '零售', value: 'retail' },
        ],
        rules: [{ required: true, message: '请选择行业', trigger: 'change' }],
      },
      {
        name: 'source',
        label: '客户来源',
        type: 'radio',
        data: [
          { label: '线上推广', value: 'online' },
          { label: '老客户介绍', value: 'referral' },
          { label: '线下活动', value: 'offline' },
        ],
        rules: [{ required: true, message: '请选择来源', trigger: 'change' }],
      },
      {
        name: 'remark',
        label: '备注',
        type: 'textarea',
        placeholder: '可填写补充说明',
      },
    ],
  },
  {
    title: '确认提交',
    description: '核对信息并完成创建',
    options: [
      {
        name: 'level',
        label: '客户等级',
        type: 'select',
        data: [
          { label: '普通', value: 'normal' },
          { label: '重点', value: 'important' },
          { label: '战略', value: 'strategic' },
        ],
        rules: [{ required: true, message: '请选择客户等级', trigger: 'change' }],
      },
    ],
  },
];

function handleSubmit(data: Record<string, unknown>) {
  MessagePlugin.success(\`提交成功：\${JSON.stringify(data)}\`);
}
<\/script>

<template>
  <StepForm v-model="model" :steps="steps" @submit="handleSubmit" />
<\/template>`;

const requestCode = `<script setup lang="ts">
import type { StepFormInstance, StepFormStepOption } from '@/components/ProComponents/StepForm/types';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref, useTemplateRef } from 'vue';

const stepFormRef = useTemplateRef<StepFormInstance>('stepFormRef');
const model = ref<Record<string, unknown>>({});
const loading = ref(false);

const steps: StepFormStepOption[] = [
  {
    title: '基本信息',
    description: '挂载时通过全局 request 回填',
    options: [
      {
        name: 'name',
        label: '客户名称',
        rules: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
      },
      {
        name: 'phone',
        label: '联系电话',
        rules: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
      },
    ],
  },
  {
    title: '业务信息',
    description: '进入本步时通过 steps[].request 按需回填',
    options: [
      {
        name: 'industry',
        label: '所属行业',
        type: 'select',
        data: [
          { label: '互联网', value: 'internet' },
          { label: '制造业', value: 'manufacture' },
          { label: '零售', value: 'retail' },
        ],
        rules: [{ required: true, message: '请选择行业', trigger: 'change' }],
      },
      {
        name: 'source',
        label: '客户来源',
        type: 'radio',
        data: [
          { label: '线上推广', value: 'online' },
          { label: '老客户介绍', value: 'referral' },
        ],
        rules: [{ required: true, message: '请选择来源', trigger: 'change' }],
      },
    ],
    request: () => new Promise<Record<string, string>>((resolve) => {
      setTimeout(() => {
        resolve({
          industry: 'internet',
          source: 'referral',
        });
      }, 400);
    }),
  },
  {
    title: '确认提交',
    description: '核对信息后保存',
    options: [
      {
        name: 'level',
        label: '客户等级',
        type: 'select',
        data: [
          { label: '普通', value: 'normal' },
          { label: '重点', value: 'important' },
        ],
        rules: [{ required: true, message: '请选择客户等级', trigger: 'change' }],
      },
    ],
  },
];

function request() {
  return new Promise<Record<string, string>>((resolve) => {
    setTimeout(() => {
      resolve({
        name: '杭州某某科技',
        phone: '13800138000',
        level: 'important',
      });
    }, 400);
  });
}

async function reload() {
  stepFormRef.value?.reset();
  await stepFormRef.value?.request();
  MessagePlugin.success('已重新加载');
}

function handleSubmit(data: Record<string, unknown>) {
  MessagePlugin.success(\`保存成功：\${JSON.stringify(data)}\`);
}
<\/script>

<template>
  <t-space>
    <t-button theme="primary" @click="reload">重新加载</t-button>
  </t-space>
  <StepForm
    ref="stepFormRef"
    v-model="model"
    v-model:loading="loading"
    :steps="steps"
    :request="request"
    @submit="handleSubmit"
  />
<\/template>`;

const customCode = `<script setup lang="tsx">
import type { StepFormStepOption } from '@/components/ProComponents/StepForm/types';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const model = ref<Record<string, unknown>>({});

const steps: StepFormStepOption[] = [
  {
    title: '基础配置',
    description: '支持 type 函数自定义表单项',
    options: [
      {
        name: 'title',
        label: '标题',
        rules: [{ required: true, message: '请输入标题', trigger: 'blur' }],
      },
      {
        name: 'tip',
        label: '自定义区域',
        type: () => (
          <div class="pl-2 text-base border-l-4 border-[var(--td-brand-color)]">
            type 函数自定义内容
          </div>
        ),
      },
    ],
  },
  {
    title: '扩展设置',
    description: '支持 #form-{name} 插槽自定义',
    options: [
      { name: 'slotSetting', label: '插槽区域' },
      {
        name: 'remark',
        label: '备注',
        type: 'textarea',
        placeholder: '可填写补充说明',
      },
    ],
  },
];

function handleSubmit(data: Record<string, unknown>) {
  MessagePlugin.success(\`提交成功：\${JSON.stringify(data)}\`);
}
<\/script>

<template>
  <StepForm v-model="model" :steps="steps" @submit="handleSubmit">
    <template #form-slotSetting>
      <div class="text-[var(--td-text-color-secondary)]">
        我是 #form-slotSetting 插槽内容
      </div>
    </template>
  </StepForm>
<\/template>`;
</script>

<template>
    <div class="pro-step-form-doc">
        <aside class="pro-step-form-doc__anchor">
            <div class="pro-step-form-doc__anchor-title">本页目录</div>
            <button
                v-for="item in anchors"
                :key="item.id"
                type="button"
                class="pro-step-form-doc__anchor-item"
                :class="{ 'is-active': activeAnchor === item.id }"
                @click="scrollToAnchor(item.id)"
            >
                {{ item.title }}
            </button>
        </aside>

        <div class="pro-step-form-doc__content">
            <div class="pro-step-form-doc__intro">
                <h2 class="pro-step-form-doc__name">StepForm 步骤表单</h2>
                <p class="pro-step-form-doc__summary">
                    基于 <code>ProForm</code> 封装的步骤表单，顶部使用 TDesign <code>Steps</code> 展示进度，
                    每一步包含标题与描述；点击「下一步」会先校验当前步，通过后渲染下一步的 <code>ProForm</code>。
                    支持 <code>v-model</code> 共享表单数据、<code>v-model:current</code> 控制当前步骤；
                    编辑场景可通过全局 <code>request</code> 或单步 <code>steps[].request</code> 异步回填；
                    自定义渲染与 <code>ProForm</code> 一致，支持 <code>type</code> 函数与 <code>#form-{'{name}'}</code> 插槽。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="分步填写并校验"
                detail="steps 中配置 title / description / options；最后一步按钮为「提交」。"
                :code="basicCode"
                borderless-card
            >
                <BasicStepForm />
            </DemoBlock>

            <DemoBlock
                id="request"
                title="异步回填"
                description="编辑场景加载初始值"
                detail="全局 request 在挂载时回填；steps[].request 在进入对应步骤时按需加载。可通过 ref.request() 手动重新回填。"
                :code="requestCode"
                :default-expanded="false"
                borderless-card
            >
                <RequestStepForm />
            </DemoBlock>

            <DemoBlock
                id="custom"
                title="自定义渲染"
                description="type 函数与表单插槽"
                detail="与 ProForm 一致，支持 type 函数和 #form-{name} 插槽；插槽会透传到当前步骤的 ProForm。"
                :code="customCode"
                :default-expanded="false"
                borderless-card
            >
                <CustomStepForm />
            </DemoBlock>
        </div>
    </div>
</template>

<style scoped lang="scss">
.pro-step-form-doc {
    position: relative;
    display: flex;
    gap: 32px;
    align-items: flex-start;
    max-width: 1280px;
    margin: 0 auto;
    padding: 8px 4px 48px;
}

.pro-step-form-doc__content {
    flex: 1;
    min-width: 0;
    order: 1;
}

.pro-step-form-doc__anchor {
    position: sticky;
    top: 72px;
    flex-shrink: 0;
    order: 2;
    width: 148px;
    padding: 4px 0;
}

.pro-step-form-doc__anchor-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.pro-step-form-doc__anchor-item {
    display: block;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--td-text-color-secondary);
    font-size: 13px;
    text-align: left;
    cursor: pointer;

    &:hover,
    &.is-active {
        color: var(--td-brand-color);
        background: var(--td-brand-color-light);
    }
}

.pro-step-form-doc__intro {
    margin-bottom: 24px;
}

.pro-step-form-doc__name {
    margin: 0 0 12px;
    font-size: 28px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.pro-step-form-doc__summary {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--td-text-color-secondary);

    code {
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--td-bg-color-component);
        font-size: 13px;
    }
}
</style>
