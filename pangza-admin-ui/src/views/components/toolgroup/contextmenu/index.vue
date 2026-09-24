<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicContextMenu from './demos/BasicContextMenu.vue';
import AdvancedContextMenu from './demos/AdvancedContextMenu.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'advanced', title: '禁用隐藏与自定义' },
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
import IContextMenu from '@/components/public/ContextMenu/index.vue';

const options = [
  { content: '刷新', value: 'refresh' },
  { content: '复制', value: 'copy' },
];
<\/script>

<template>
  <IContextMenu :options="options" @choose="handleChoose">
    <div>在此区域右键</div>
  </IContextMenu>
<\/template>`;

const advancedCode = `<script setup lang="tsx">
const options = [
  { content: '查看', value: 'view' },
  {
    content: () => <span>自定义渲染</span>,
    value: 'custom',
  },
  { content: '编辑', value: 'edit', disabled: true },
  { content: '隐藏项', value: 'secret', hidden: () => true },
];
<\/script>`;
</script>

<template>
    <div class="doc-page">
        <aside class="doc-page__anchor">
            <div class="doc-page__anchor-title">本页目录</div>
            <button
                v-for="item in anchors"
                :key="item.id"
                type="button"
                class="doc-page__anchor-item"
                :class="{ 'is-active': activeAnchor === item.id }"
                @click="scrollToAnchor(item.id)"
            >
                {{ item.title }}
            </button>
        </aside>

        <div class="doc-page__content">
            <div class="doc-page__intro">
                <h2 class="doc-page__name">ContextMenu 右键菜单</h2>
                <p class="doc-page__summary">
                    组件名为 <code>IContextMenu</code>。包裹任意内容后可右键弹出菜单。
                    <code>options</code> 支持 <code>content</code>（字符串或渲染函数）、
                    <code>disabled</code>、<code>hidden</code>；选中后触发 <code>@choose(value, option)</code>。
                    样式跟随主题变量，适配浅色 / 深色。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="右键打开菜单"
                detail="将需要响应右键的区域放在默认插槽内。"
                :code="basicCode"
                borderless-card
            >
                <BasicContextMenu />
            </DemoBlock>

            <DemoBlock
                id="advanced"
                title="禁用隐藏与自定义"
                description="disabled / hidden / 自定义 content"
                detail="hidden 可为函数，按条件动态隐藏菜单项。"
                :code="advancedCode"
                :default-expanded="false"
                borderless-card
            >
                <AdvancedContextMenu />
            </DemoBlock>
        </div>
    </div>
</template>

<style scoped lang="scss">
.doc-page {
    position: relative;
    display: flex;
    gap: 32px;
    align-items: flex-start;
    max-width: 1280px;
    margin: 0 auto;
    padding: 8px 4px 48px;
}

.doc-page__content {
    flex: 1;
    min-width: 0;
    order: 1;
}

.doc-page__anchor {
    position: sticky;
    top: 72px;
    flex-shrink: 0;
    order: 2;
    width: 148px;
    padding: 4px 0;
}

.doc-page__anchor-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.doc-page__anchor-item {
    display: block;
    width: 100%;
    padding: 8px 10px;
    border: 0;
    border-left: 2px solid transparent;
    background: transparent;
    color: var(--td-text-color-secondary);
    font-size: 13px;
    text-align: left;
    cursor: pointer;

    &:hover {
        color: var(--td-brand-color);
    }

    &.is-active {
        border-left-color: var(--td-brand-color);
        color: var(--td-brand-color);
        font-weight: 500;
    }
}

.doc-page__intro {
    margin-bottom: 32px;
}

.doc-page__name {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.doc-page__summary {
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
    .doc-page {
        flex-direction: column;
    }

    .doc-page__anchor {
        position: static;
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        gap: 4px 8px;
    }

    .doc-page__anchor-title {
        width: 100%;
    }

    .doc-page__anchor-item {
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
