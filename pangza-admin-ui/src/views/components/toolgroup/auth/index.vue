<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicAuth from './demos/BasicAuth.vue';
import NeedShowAuth from './demos/NeedShowAuth.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'need-show', title: '强制展示' },
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
  <Auth permission="system:user:list">
    <t-button>有权限才显示</t-button>
  </Auth>
<\/template>`;

const needShowCode = `<template>
  <Auth permission="demo:never:exists" need-show>
    <template #default="{ hasAuth }">
      <t-button :disabled="!hasAuth">无权限时禁用</t-button>
    </template>
  </Auth>
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
                <h2 class="doc-page__name">Auth 权限控制</h2>
                <p class="doc-page__summary">
                    按权限码控制插槽是否渲染。传入 <code>permission</code>（字符串或数组，满足其一即可），
                    内部调用 <code>hasPermission</code>。设置 <code>needShow</code> 可强制渲染，并通过插槽参数
                    <code>hasAuth</code> 自行处理禁用等逻辑。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="按权限渲染内容"
                detail="无权限且 needShow=false（默认）时不渲染默认插槽；插槽可拿到 permission、hasAuth。"
                :code="basicCode"
                borderless-card
            >
                <BasicAuth />
            </DemoBlock>

            <DemoBlock
                id="need-show"
                title="强制展示"
                description="needShow 配合 hasAuth"
                detail="适合「无权限时仍展示但禁用」的场景。"
                :code="needShowCode"
                :default-expanded="false"
                borderless-card
            >
                <NeedShowAuth />
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
