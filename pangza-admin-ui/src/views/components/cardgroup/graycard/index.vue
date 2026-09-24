<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicGrayCard from './demos/BasicGrayCard.vue';
import BorderGrayCard from './demos/BorderGrayCard.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'border', title: '边框' },
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
  <GrayCard>
    <div>默认灰底卡片内容</div>
  </GrayCard>
<\/template>`;

const borderCode = `<template>
  <GrayCard border>
    <div>带边框的灰底卡片</div>
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
                <h2 class="doc-page__name">GrayCard 灰底卡片</h2>
                <p class="doc-page__summary">
                    浅灰背景容器，常与 <code>RenderColumn</code> / <code>Grid</code> 组合展示详情字段。
                    背景色随主题切换；设置 <code>border</code> 可显示边框。其余属性透传至根节点。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="默认灰底"
                detail="内容通过默认插槽传入。"
                :code="basicCode"
                borderless-card
            >
                <BasicGrayCard />
            </DemoBlock>

            <DemoBlock
                id="border"
                title="边框"
                description="显示边框"
                detail="border 为 true 时增加边框，颜色随主题变化。"
                :code="borderCode"
                :default-expanded="false"
                borderless-card
            >
                <BorderGrayCard />
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
