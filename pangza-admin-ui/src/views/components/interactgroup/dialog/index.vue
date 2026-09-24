<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicDialogButton from './demos/BasicDialogButton.vue';
import ThemeDialogButton from './demos/ThemeDialogButton.vue';
import BasicDialogLink from './demos/BasicDialogLink.vue';
import AsyncDialogLink from './demos/AsyncDialogLink.vue';

/** 锚点目录 */
const anchors = [
    { id: 'button-basic', title: 'DialogButton 基础' },
    { id: 'button-theme', title: '按钮主题与插槽' },
    { id: 'link-basic', title: 'DialogLink 基础' },
    { id: 'link-async', title: '异步确认' },
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

const buttonBasicCode = `<script setup lang="tsx">
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';

function handleConfirm(instance: DialogInstance) {
  MessagePlugin.success('已确认');
  instance.hide();
}
<\/script>

<template>
  <DialogButton
    header="系统提示"
    content="确认执行该操作吗？"
    @confirm="handleConfirm"
  >
    基础确认
  </DialogButton>
<\/template>`;

const buttonThemeCode = `<script setup lang="tsx">
import type { DialogInstance } from 'tdesign-vue-next';

function handleConfirm(instance: DialogInstance) {
  instance.destroy();
}
<\/script>

<template>
  <DialogButton
    theme="danger"
    header="删除确认"
    content="删除后不可恢复，是否继续？"
    :dialog-props="{ theme: 'danger' }"
    @confirm="handleConfirm"
  >
    危险操作
  </DialogButton>

  <DialogButton header="自定义内容" @confirm="(ins) => ins.hide()">
    <template #content>
      <div>可通过 #content 插槽自定义弹窗内容</div>
    </template>
    插槽内容
  </DialogButton>
<\/template>`;

const linkBasicCode = `<script setup lang="tsx">
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';

function handleConfirm(instance: DialogInstance) {
  MessagePlugin.success('已确认');
  instance.destroy();
}
<\/script>

<template>
  <DialogLink
    theme="danger"
    hover="color"
    header="系统提示"
    content="是否删除当前数据？"
    @confirm="handleConfirm"
  >
    删除
  </DialogLink>
<\/template>`;

const linkAsyncCode = `<script setup lang="tsx">
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';

async function handleConfirm(instance: DialogInstance) {
  await doSomething();
  MessagePlugin.success('操作成功');
  instance.destroy();
}
<\/script>

<template>
  <DialogLink
    theme="primary"
    hover="color"
    header="异步确认"
    content="点击确认后执行异步操作"
    @confirm="handleConfirm"
  >
    异步确认
  </DialogLink>
<\/template>`;
</script>

<template>
    <div class="pro-dialog-doc">
        <aside class="pro-dialog-doc__anchor">
            <div class="pro-dialog-doc__anchor-title">本页目录</div>
            <button
                v-for="item in anchors"
                :key="item.id"
                type="button"
                class="pro-dialog-doc__anchor-item"
                :class="{ 'is-active': activeAnchor === item.id }"
                @click="scrollToAnchor(item.id)"
            >
                {{ item.title }}
            </button>
        </aside>

        <div class="pro-dialog-doc__content">
            <div class="pro-dialog-doc__intro">
                <h2 class="pro-dialog-doc__name">DialogButton / DialogLink</h2>
                <p class="pro-dialog-doc__summary">
                    基于 TDesign <code>DialogPlugin</code> 封装的确认弹窗触发器。
                    <code>DialogButton</code> 渲染为按钮，<code>DialogLink</code> 渲染为链接，适合表格操作列删除 / 确认场景。
                    确认后需在 <code>@confirm</code> 中调用 <code>instance.hide()</code> 或 <code>instance.destroy()</code> 关闭弹窗。
                </p>
            </div>

            <DemoBlock
                id="button-basic"
                title="DialogButton 基础"
                description="按钮触发确认弹窗"
                detail="传入 header、content，监听 confirm / cancel；确认回调会收到 DialogInstance。"
                :code="buttonBasicCode"
                borderless-card
            >
                <BasicDialogButton />
            </DemoBlock>

            <DemoBlock
                id="button-theme"
                title="按钮主题与插槽"
                description="主题色与自定义内容"
                detail="theme / variant 透传给 Button；dialog-props 透传给 DialogPlugin；可用 #content 自定义弹窗主体。"
                :code="buttonThemeCode"
                :default-expanded="false"
                borderless-card
            >
                <ThemeDialogButton />
            </DemoBlock>

            <DemoBlock
                id="link-basic"
                title="DialogLink 基础"
                description="链接触发确认弹窗"
                detail="用法与 DialogButton 类似，常用于表格操作列；hover / theme 透传给 Link。"
                :code="linkBasicCode"
                :default-expanded="false"
                borderless-card
            >
                <BasicDialogLink />
            </DemoBlock>

            <DemoBlock
                id="link-async"
                title="异步确认"
                description="确认后执行异步逻辑再关闭"
                detail="默认不会自动关闭，需在异步结束后手动 instance.destroy() / hide()。"
                :code="linkAsyncCode"
                :default-expanded="false"
                borderless-card
            >
                <AsyncDialogLink />
            </DemoBlock>
        </div>
    </div>
</template>

<style scoped lang="scss">
.pro-dialog-doc {
    position: relative;
    display: flex;
    gap: 32px;
    align-items: flex-start;
    max-width: 1280px;
    margin: 0 auto;
    padding: 8px 4px 48px;
}

.pro-dialog-doc__content {
    flex: 1;
    min-width: 0;
    order: 1;
}

.pro-dialog-doc__anchor {
    position: sticky;
    top: 72px;
    flex-shrink: 0;
    order: 2;
    width: 148px;
    padding: 4px 0;
}

.pro-dialog-doc__anchor-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.pro-dialog-doc__anchor-item {
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

.pro-dialog-doc__intro {
    margin-bottom: 32px;
}

.pro-dialog-doc__name {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--td-text-color-primary);
}

.pro-dialog-doc__summary {
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
    .pro-dialog-doc {
        flex-direction: column;
    }

    .pro-dialog-doc__anchor {
        position: static;
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        gap: 4px 8px;
    }

    .pro-dialog-doc__anchor-title {
        width: 100%;
    }

    .pro-dialog-doc__anchor-item {
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
