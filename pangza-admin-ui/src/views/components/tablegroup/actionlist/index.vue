<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicActionList from './demos/BasicActionList.vue';
import SlotActionList from './demos/SlotActionList.vue';
import CustomSlotActionList from './demos/CustomSlotActionList.vue';
import BorderlessActionList from './demos/BorderlessActionList.vue';
import SizeActionList from './demos/SizeActionList.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'action-slot', title: '右侧操作区' },
    { id: 'content-slot', title: '内容插槽' },
    { id: 'borderless', title: '无边框' },
    { id: 'size', title: '间距尺寸' },
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
import { MessagePlugin } from 'tdesign-vue-next';

const options = [
  {
    value: 'profile',
    label: '个人资料',
    description: '查看并修改你的账户信息',
    icon: () => <MyIcon name="User" size={20} />,
  },
  {
    value: 'security',
    label: '安全设置',
    description: '密码、两步验证等相关设置',
    icon: () => <MyIcon name="Shield" size={20} />,
  },
];

function handleClick(value: string) {
  MessagePlugin.info(\`点击了：\${value}\`);
}
<\/script>

<template>
  <ActionList :options="options" @click="handleClick" />
<\/template>`;

const actionSlotCode = `<script setup lang="tsx">
const notifyEnabled = ref(true);

const options = [
  {
    value: 'email',
    label: '邮箱绑定',
    description: '用于接收重要通知',
    icon: () => <MyIcon name="Mail" size={20} />,
  },
  {
    value: 'notify',
    label: '消息推送',
    description: '开启后可接收实时消息',
    icon: () => <MyIcon name="Bell" size={20} />,
  },
];
<\/script>

<template>
  <ActionList :options="options">
    <template #action-email>
      <t-link theme="primary">去绑定</t-link>
    </template>
    <template #action-notify>
      <t-switch v-model="notifyEnabled" />
    </template>
  </ActionList>
<\/template>`;

const contentSlotCode = `<script setup lang="tsx">
const options = [
  {
    value: 'theme',
    label: '外观主题',
    description: '使用插槽自定义标题与描述',
    icon: 'unused',
  },
];
<\/script>

<template>
  <ActionList :options="options" :border="false">
    <template #icon-theme>...</template>
    <template #label-theme>...</template>
    <template #description-theme>...</template>
    <template #action-theme>...</template>
  </ActionList>
<\/template>`;

const borderlessCode = `<script setup lang="tsx">
const options = [
  {
    value: 'profile',
    label: '个人资料',
    description: '查看并修改你的账户信息',
    icon: () => <MyIcon name="User" size={20} />,
  },
  {
    value: 'security',
    label: '安全设置',
    description: '密码、两步验证等相关设置',
    icon: () => <MyIcon name="Shield" size={20} />,
  },
];
<\/script>

<template>
  <!-- 默认带分割线 -->
  <ActionList :options="options" />

  <!-- borderless 隐藏项之间的下边框 -->
  <ActionList :options="options" borderless />
<\/template>`;

const sizeCode = `<script setup lang="tsx">
const options = [
  {
    value: 'profile',
    label: '个人资料',
    description: '查看并修改你的账户信息',
    icon: () => <MyIcon name="User" size={20} />,
  },
  {
    value: 'security',
    label: '安全设置',
    description: '密码、两步验证等相关设置',
    icon: () => <MyIcon name="Shield" size={20} />,
  },
];
<\/script>

<template>
  <ActionList :options="options" size="small" />
  <ActionList :options="options" size="base" />
  <ActionList :options="options" size="large" />
<\/template>`;
</script>

<template>
    <div class="pro-action-list-doc">
        <aside class="pro-action-list-doc__anchor">
            <div class="pro-action-list-doc__anchor-title">本页目录</div>
            <button
                v-for="item in anchors"
                :key="item.id"
                type="button"
                class="pro-action-list-doc__anchor-item"
                :class="{ 'is-active': activeAnchor === item.id }"
                @click="scrollToAnchor(item.id)"
            >
                {{ item.title }}
            </button>
        </aside>

        <div class="pro-action-list-doc__content">
            <div class="pro-action-list-doc__intro">
                <h2 class="pro-action-list-doc__name">ActionList 操作列表</h2>
                <p class="pro-action-list-doc__summary">
                    设置类场景的操作列表：每项支持图标、标题、描述与右侧操作区。
                    <code>options</code> 中 <code>label</code> / <code>description</code> / <code>icon</code> 可为字符串或渲染函数；
                    也可用 <code>#label-&#123;value&#125;</code>、<code>#description-&#123;value&#125;</code>、<code>#icon-&#123;value&#125;</code>、
                    <code>#action-&#123;value&#125;</code> 插槽覆盖。支持 <code>borderless</code> 控制分割线、
                    <code>size</code>（small / base / large）控制上下间距。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="配置 options 渲染列表"
                detail="点击标题区域触发 @click(value, option)；默认带底部分割线。"
                :code="basicCode"
                borderless-card
            >
                <BasicActionList />
            </DemoBlock>

            <DemoBlock
                id="action-slot"
                title="右侧操作区"
                description="使用 #action-{value} 插槽"
                detail="右侧可放链接、开关、按钮等，适合设置页「去绑定 / 开关 / 危险操作」一类交互。"
                :code="actionSlotCode"
                :default-expanded="false"
                borderless-card
            >
                <SlotActionList />
            </DemoBlock>

            <DemoBlock
                id="content-slot"
                title="内容插槽"
                description="自定义图标、标题、描述"
                detail="插槽命名规则为 #icon-{value} / #label-{value} / #description-{value}；也可使用 borderless 关闭分割线。"
                :code="contentSlotCode"
                :default-expanded="false"
                borderless-card
            >
                <CustomSlotActionList />
            </DemoBlock>

            <DemoBlock
                id="borderless"
                title="无边框"
                description="borderless 控制分割线"
                detail="默认显示项之间的下边框；设置 borderless 后隐藏分割线，适合卡片内嵌列表等场景。"
                :code="borderlessCode"
                :default-expanded="false"
                borderless-card
            >
                <BorderlessActionList />
            </DemoBlock>

            <DemoBlock
                id="size"
                title="间距尺寸"
                description="size 控制上下间距"
                detail="size 可选 small / base / large，同时影响列表项内边距与项间距；默认 base。"
                :code="sizeCode"
                :default-expanded="false"
                borderless-card
            >
                <SizeActionList />
            </DemoBlock>
        </div>
    </div>
</template>

<style scoped lang="scss">
.pro-action-list-doc {
    position: relative;
    display: flex;
    gap: 32px;
    align-items: flex-start;
    max-width: 1280px;
    margin: 0 auto;
    padding: 8px 4px 48px;
}

.pro-action-list-doc__content {
    flex: 1;
    min-width: 0;
    order: 1;
}

.pro-action-list-doc__anchor {
    position: sticky;
    top: 72px;
    flex-shrink: 0;
    order: 2;
    width: 148px;
    padding: 4px 0;
}

.pro-action-list-doc__anchor-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.pro-action-list-doc__anchor-item {
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

.pro-action-list-doc__intro {
    margin-bottom: 32px;
}

.pro-action-list-doc__name {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--td-text-color-primary);
}

.pro-action-list-doc__summary {
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
    .pro-action-list-doc {
        flex-direction: column;
    }

    .pro-action-list-doc__anchor {
        position: static;
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        gap: 4px 8px;
    }

    .pro-action-list-doc__anchor-title {
        width: 100%;
    }

    .pro-action-list-doc__anchor-item {
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
