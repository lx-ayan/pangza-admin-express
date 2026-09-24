<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicSuccess from './demos/BasicSuccess.vue';
import ActionSuccess from './demos/ActionSuccess.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础用法' },
    { id: 'action', title: '操作区' },
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
  <Success
    title="操作成功"
    description="提交结果页用于反馈一系列操作任务的处理结果。"
    other-message="这里是其他内容信息"
  />
<\/template>`;

const actionCode = `<template>
  <Success
    title="操作成功"
    description="提交结果页用于反馈一系列操作任务的处理结果。"
    other-message="这里是其他内容信息"
  >
    <template #action>
      <t-space>
        <t-button variant="outline" theme="primary">返回列表</t-button>
        <t-button>继续添加</t-button>
      </t-space>
    </template>
  </Success>
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
                <h2 class="doc-page__name">Success 成功结果</h2>
                <p class="doc-page__summary">
                    操作成功结果页，API 与 Error 一致：支持 <code>title</code>、<code>description</code>、
                    <code>otherMessage</code> / 同名插槽，以及 <code>action</code> 插槽。
                    样式已适配浅色 / 深色主题。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础用法"
                description="标题 + 说明 + 补充信息"
                detail="otherMessage 会显示在灰色信息块中。"
                :code="basicCode"
                borderless-card
            >
                <BasicSuccess />
            </DemoBlock>

            <DemoBlock
                id="action"
                title="操作区"
                description="底部按钮"
                detail="通过 action 插槽放置返回、继续等操作。"
                :code="actionCode"
                :default-expanded="false"
                borderless-card
            >
                <ActionSuccess />
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
