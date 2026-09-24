<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicCircleTag from './demos/BasicCircleTag.vue';
import SizeCircleTag from './demos/SizeCircleTag.vue';
import AnimationCircleTag from './demos/AnimationCircleTag.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'size', title: '尺寸' },
    { id: 'animation', title: '动画' },
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
  <CircleTag color="var(--td-success-color)">启用</CircleTag>
<\/template>`;

const sizeCode = `<template>
  <CircleTag size="small">small</CircleTag>
  <CircleTag size="base">base</CircleTag>
  <CircleTag size="large">large</CircleTag>
  <CircleTag width="10px" height="10px">自定义</CircleTag>
<\/template>`;

const animationCode = `<template>
  <CircleTag color="var(--td-error-color)" animation>脉冲</CircleTag>
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
                <h2 class="doc-page__name">CircleTag 圆点标签</h2>
                <p class="doc-page__summary">
                    左侧色点 + 右侧文案，适合状态展示。支持 <code>color</code>、<code>size</code>（small / base / large）、
                    <code>width</code> / <code>height</code> 自定义圆点尺寸，以及 <code>animation</code> 脉冲效果。
                    颜色建议使用 CSS 变量以适配浅色 / 深色主题。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="色点 + 文案"
                detail="默认色点尺寸 base；文案通过默认插槽传入。"
                :code="basicCode"
                borderless-card
            >
                <BasicCircleTag />
            </DemoBlock>

            <DemoBlock
                id="size"
                title="尺寸"
                description="预设与自定义"
                detail="size 控制预设圆点大小；也可用 width / height 覆盖。"
                :code="sizeCode"
                :default-expanded="false"
                borderless-card
            >
                <SizeCircleTag />
            </DemoBlock>

            <DemoBlock
                id="animation"
                title="动画"
                description="开启脉冲"
                detail="设置 animation 后圆点使用 pulse 动画。"
                :code="animationCode"
                :default-expanded="false"
                borderless-card
            >
                <AnimationCircleTag />
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
