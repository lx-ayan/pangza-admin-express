<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicDemoBlock from './demos/BasicDemoBlock.vue';
import CardDemoBlock from './demos/CardDemoBlock.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'card', title: '无边框卡片' },
    { id: 'collapsed', title: '默认收起代码' },
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

const basicCode = `<template>
  <DemoBlock
    id="basic"
    title="基础用法"
    description="简短说明"
    detail="补充说明（次要文案）"
    :code="code"
  >
    <!-- 预览区内容 -->
  </DemoBlock>
<\/template>`;

const cardCode = `<template>
  <DemoBlock
    title="表单预览"
    description="使用无边框卡片包裹"
    :code="code"
    borderless-card
  >
    <t-form>...</t-form>
  </DemoBlock>
<\/template>`;

const collapsedCode = `<template>
  <DemoBlock
    title="默认收起"
    :code="code"
    :default-expanded="false"
    borderless-card
  >
    <!-- 预览区内容 -->
  </DemoBlock>
<\/template>`;
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
                <h2 class="doc-page__name">DemoBlock 示例区块</h2>
                <p class="doc-page__summary">
                    组件文档页的标准示例容器：标题、说明、预览区、可展开 / 复制的代码块。
                    常用属性：<code>id</code>（锚点）、<code>title</code>、<code>description</code>、
                    <code>detail</code>、<code>code</code>、<code>defaultExpanded</code>、
                    <code>borderlessCard</code>（表单等场景用无边框卡片包裹预览）。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="标题 + 说明 + 预览 + 代码"
                detail="默认直接渲染插槽；代码区默认展开，可复制。"
                :code="basicCode"
            >
                <BasicDemoBlock />
            </DemoBlock>

            <DemoBlock
                id="card"
                title="无边框卡片"
                description="borderlessCard"
                detail="适合表单、结果页等需要卡片容器的预览。"
                :code="cardCode"
                :default-expanded="false"
                borderless-card
            >
                <CardDemoBlock />
            </DemoBlock>

            <DemoBlock
                id="collapsed"
                title="默认收起代码"
                description="defaultExpanded=false"
                detail="点击工具栏代码图标可展开 / 收起。"
                :code="collapsedCode"
                :default-expanded="false"
                borderless-card
            >
                <div class="text-sm text-[var(--td-text-color-secondary)]">代码区默认收起。</div>
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
