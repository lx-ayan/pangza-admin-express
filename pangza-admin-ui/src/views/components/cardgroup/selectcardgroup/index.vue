<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicSelectCardGroup from './demos/BasicSelectCardGroup.vue';
import MultipleSelectCardGroup from './demos/MultipleSelectCardGroup.vue';
import CustomSelectCardGroup from './demos/CustomSelectCardGroup.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '单选' },
    { id: 'multiple', title: '多选' },
    { id: 'custom', title: '自定义选项' },
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
import { ref } from 'vue';
import type { SelectCardOption } from '@/components/public/SelectCardGroup/types';

const options: SelectCardOption[] = [
  { value: 'admin', label: '管理员', description: '拥有系统全部权限' },
  { value: 'editor', label: '编辑', description: '可编辑业务内容' },
  { value: 'viewer', label: '访客', description: '仅可查看', disabled: true },
];

const role = ref('admin');
<\/script>

<template>
  <SelectCardGroup v-model="role" :options="options" :columns="3" />
<\/template>`;

const multipleCode = `<script setup lang="ts">
import { ref } from 'vue';
import type { SelectCardOption } from '@/components/public/SelectCardGroup/types';

const options: SelectCardOption[] = [
  { value: '1', label: '系统管理', description: '用户 / 角色 / 菜单' },
  { value: '2', label: '日志审计', description: '操作日志与登录日志' },
];

const roleIds = ref(['1', '2']);
<\/script>

<template>
  <SelectCardGroup
    v-model="roleIds"
    :options="options"
    multiple
    :columns="2"
  />
<\/template>`;

const customCode = `<template>
  <SelectCardGroup v-model="theme" :options="options" :columns="2">
    <template #option="{ option, selected }">
      <div class="flex items-center gap-3">
        <MyIcon :name="option.value === 'dark' ? 'Moon' : 'Sun'" :size="20" />
        <div>
          <div>{{ option.label }}</div>
          <div>{{ option.description }}</div>
        </div>
      </div>
    </template>
  </SelectCardGroup>
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
                <h2 class="doc-page__name">SelectCardGroup 卡片选择</h2>
                <p class="doc-page__summary">
                    卡片式单选 / 多选。使用 <code>v-model</code> 绑定选中值（单选为单个值，多选为数组），
                    <code>options</code> 为选项列表，<code>columns</code> 控制网格列数，
                    <code>emptyText</code> 控制空态文案。可通过 <code>#option</code> 插槽自定义卡片内容。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="单选"
                description="点击切换，再点可取消"
                detail="选项支持 label / description / disabled。"
                :code="basicCode"
                borderless-card
            >
                <BasicSelectCardGroup />
            </DemoBlock>

            <DemoBlock
                id="multiple"
                title="多选"
                description="multiple 模式"
                detail="v-model 绑定数组；常用于绑定角色等场景。"
                :code="multipleCode"
                :default-expanded="false"
                borderless-card
            >
                <MultipleSelectCardGroup />
            </DemoBlock>

            <DemoBlock
                id="custom"
                title="自定义选项"
                description="option 插槽"
                detail="插槽参数：option、selected。"
                :code="customCode"
                :default-expanded="false"
                borderless-card
            >
                <CustomSelectCardGroup />
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
