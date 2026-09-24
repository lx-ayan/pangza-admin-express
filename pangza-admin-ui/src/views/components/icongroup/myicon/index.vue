<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicMyIcon from './demos/BasicMyIcon.vue';
import StyleMyIcon from './demos/StyleMyIcon.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'style', title: '样式定制' },
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
  <MyIcon name="User" :size="20" />
  <MyIcon name="Settings" :size="20" />
  <MyIcon name="Bell" :size="20" />
<\/template>`;

const styleCode = `<template>
  <MyIcon name="User" :size="16" color="var(--td-brand-color)" />
  <MyIcon name="Zap" :size="24" color="#E37318" :stroke-width="1.5" />
  <MyIcon name="Heart" :size="28" color="#D54941" :stroke-width="2" />
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
                <h2 class="doc-page__name">MyIcon 图标</h2>
                <p class="doc-page__summary">
                    基于 <code>lucide-vue-next</code> 的图标封装。传入 <code>name</code>（PascalCase，如
                    <code>User</code> / <code>Trash2</code>）即可渲染对应图标。
                    支持 <code>size</code>、<code>color</code>、<code>strokeWidth</code>、<code>defaultClass</code>。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="按名称渲染图标"
                detail="name 对应 lucide 图标名；全局已注册，可直接使用。"
                :code="basicCode"
                borderless-card
            >
                <BasicMyIcon />
            </DemoBlock>

            <DemoBlock
                id="style"
                title="样式定制"
                description="颜色、尺寸与描边"
                detail="color 可使用 CSS 变量或具体色号；strokeWidth 控制线条粗细。"
                :code="styleCode"
                :default-expanded="false"
                borderless-card
            >
                <StyleMyIcon />
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
