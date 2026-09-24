<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicModalForm from './demos/BasicModalForm.vue';
import RequestModalForm from './demos/RequestModalForm.vue';
import CustomModalForm from './demos/CustomModalForm.vue';

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

const basicCode = `<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const visible = ref(false);

const options: ProFormOption[] = [
  {
    name: 'name',
    label: '名称',
    rules: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  },
  {
    name: 'status',
    label: '状态',
    type: 'select',
    data: [
      { label: '启用', value: '1' },
      { label: '禁用', value: '2' },
    ],
  },
];

function handleSubmit(data: Record<string, unknown>) {
  MessagePlugin.success(\`提交成功：\${JSON.stringify(data)}\`);
  visible.value = false;
}
<\/script>

<template>
  <t-button @click="visible = true">新增</t-button>
  <ModalForm
    v-model:visible="visible"
    header="新增"
    :options="options"
    @submit="handleSubmit"
  />
<\/template>`;

const requestCode = `<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';
import { ref } from 'vue';

const visible = ref(false);
const options: ProFormOption[] = [/* ... */];

function request() {
  return Promise.resolve({
    name: '贾明',
    email: 'demo@example.com',
    status: '1',
  });
}
<\/script>

<template>
  <ModalForm
    v-model:visible="visible"
    header="编辑"
    :options="options"
    :request="request"
    @submit="handleSubmit"
  />
<\/template>`;

const customCode = `<script setup lang="tsx">
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';

const options: ProFormOption[] = [
  { name: 'title', label: '标题' },
  {
    name: 'tip',
    label: '自定义区域',
    type: () => <div>type 函数自定义内容</div>,
  },
  { name: 'slotSetting', label: '插槽区域' },
];
<\/script>

<template>
  <ModalForm v-model:visible="visible" header="自定义表单项" :options="options" @submit="handleSubmit">
    <template #form-slotSetting>
      <div>我是插槽内容</div>
    </template>
  </ModalForm>
<\/template>`;
</script>

<template>
    <div class="pro-modal-form-doc">
        <aside class="pro-modal-form-doc__anchor">
            <div class="pro-modal-form-doc__anchor-title">本页目录</div>
            <button
                v-for="item in anchors"
                :key="item.id"
                type="button"
                class="pro-modal-form-doc__anchor-item"
                :class="{ 'is-active': activeAnchor === item.id }"
                @click="scrollToAnchor(item.id)"
            >
                {{ item.title }}
            </button>
        </aside>

        <div class="pro-modal-form-doc__content">
            <div class="pro-modal-form-doc__intro">
                <h2 class="pro-modal-form-doc__name">ModalForm 弹窗表单</h2>
                <p class="pro-modal-form-doc__summary">
                    在 Dialog 中嵌入 <code>ProForm</code>，通过 <code>v-model:visible</code> 控制显隐，
                    <code>options</code> 配置表单项，监听 <code>@submit</code> 获取校验通过后的数据。
                    打开时自动执行 <code>request</code> 回填，关闭时自动 reset。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="新增弹窗表单"
                detail="点击确认会先校验，通过后触发 @submit；业务侧自行关闭 visible。"
                :code="basicCode"
                borderless-card
            >
                <BasicModalForm />
            </DemoBlock>

            <DemoBlock
                id="request"
                title="异步回填"
                description="编辑场景加载初始值"
                detail="传入 request 后，弹窗打开时会请求并回填表单，适合编辑弹窗。"
                :code="requestCode"
                :default-expanded="false"
                borderless-card
            >
                <RequestModalForm />
            </DemoBlock>

            <DemoBlock
                id="custom"
                title="自定义渲染"
                description="type 函数与表单插槽"
                detail="与 ProForm 一致，支持 type 函数和 #form-{name} 插槽；width / dialog-props 可透传 Dialog。"
                :code="customCode"
                :default-expanded="false"
                borderless-card
            >
                <CustomModalForm />
            </DemoBlock>
        </div>
    </div>
</template>

<style scoped lang="scss">
.pro-modal-form-doc {
    position: relative;
    display: flex;
    gap: 32px;
    align-items: flex-start;
    max-width: 1280px;
    margin: 0 auto;
    padding: 8px 4px 48px;
}

.pro-modal-form-doc__content {
    flex: 1;
    min-width: 0;
    order: 1;
}

.pro-modal-form-doc__anchor {
    position: sticky;
    top: 72px;
    flex-shrink: 0;
    order: 2;
    width: 148px;
    padding: 4px 0;
}

.pro-modal-form-doc__anchor-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.pro-modal-form-doc__anchor-item {
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

.pro-modal-form-doc__intro {
    margin-bottom: 32px;
}

.pro-modal-form-doc__name {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--td-text-color-primary);
}

.pro-modal-form-doc__summary {
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
    .pro-modal-form-doc {
        flex-direction: column;
    }

    .pro-modal-form-doc__anchor {
        position: static;
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        gap: 4px 8px;
    }

    .pro-modal-form-doc__anchor-title {
        width: 100%;
    }

    .pro-modal-form-doc__anchor-item {
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
