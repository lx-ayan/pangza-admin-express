<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicColorIcon from './demos/BasicColorIcon.vue';
import CustomColorIcon from './demos/CustomColorIcon.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'custom', title: '尺寸与形状' },
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
  <ColorIcon name="User" color="#4C6FFF" />
  <ColorIcon name="Settings" color="#2BA471" />
<\/template>`;

const customCode = `<template>
  <ColorIcon
    name="Zap"
    color="#4C6FFF"
    width="40px"
    height="40px"
    :size="20"
  />
  <ColorIcon name="Box" color="#2BA471" :circle="false" />
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
                <h2 class="doc-page__name">ColorIcon 彩色图标</h2>
                <p class="doc-page__summary">
                    在浅色背景块中展示图标，背景由 <code>color</code> 自动混色生成。
                    支持 <code>width</code> / <code>height</code>、<code>size</code>（图标大小）、
                    <code>circle</code>（是否圆形底）以及 <code>strokeWidth</code>。
                    <code>color</code> 需传入具体色号（如 <code>#4C6FFF</code>），不要传 CSS 变量。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="圆形色底 + 图标"
                detail="name 为 MyIcon / lucide 图标名；color 需传十六进制等具体色号，不能传 CSS 变量。"
                :code="basicCode"
                borderless-card
            >
                <BasicColorIcon />
            </DemoBlock>

            <DemoBlock
                id="custom"
                title="尺寸与形状"
                description="自定义容器与图标大小"
                detail="circle=false 时为圆角矩形底。"
                :code="customCode"
                :default-expanded="false"
                borderless-card
            >
                <CustomColorIcon />
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
