<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicRenderColumn from './demos/BasicRenderColumn.vue';
import SlotRenderColumn from './demos/SlotRenderColumn.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'slot', title: '自定义内容' },
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
import RenderColumn from '@/components/public/RenderColumn';
<\/script>

<template>
  <RenderColumn title="操作人" data="张三" />
  <RenderColumn title="操作时间" data="2026-07-28 10:00:00" />
  <RenderColumn title="金额" data="¥128.00" align="right" />
<\/template>`;

const slotCode = `<script setup lang="ts">
import RenderColumn from '@/components/public/RenderColumn';
<\/script>

<template>
  <GrayCard>
    <RenderColumn title="请求状态">
      <template #data>
        <CircleTag color="var(--td-success-color)">成功</CircleTag>
      </template>
    </RenderColumn>
  </GrayCard>
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
                <h2 class="doc-page__name">RenderColumn 字段列</h2>
                <p class="doc-page__summary">
                    详情场景下的「标题 + 内容」纵向字段展示。支持 <code>title</code>、<code>data</code>、
                    <code>align</code>（left / center / right），以及 <code>titleClass</code> / <code>dataClass</code>。
                    非全局组件，需从 <code>@/components/public/RenderColumn</code> 引入；复杂内容可用
                    <code>#data</code> 插槽。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="标题 + 文本值"
                detail="align 控制标题与内容的水平对齐。"
                :code="basicCode"
                borderless-card
            >
                <BasicRenderColumn />
            </DemoBlock>

            <DemoBlock
                id="slot"
                title="自定义内容"
                description="data 插槽"
                detail="常与 GrayCard、CircleTag 等组合使用。"
                :code="slotCode"
                :default-expanded="false"
                borderless-card
            >
                <SlotRenderColumn />
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
