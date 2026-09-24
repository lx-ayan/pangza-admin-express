<script setup lang="ts">
import { nextTick, ref } from 'vue';
import SideChartCard from './demos/SideChartCard.vue';
import LayoutChartCard from './demos/LayoutChartCard.vue';

/** 锚点目录 */
const anchors = [
    { id: 'side', title: '侧边小图' },
    { id: 'layout', title: '底部大图与饼图' },
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

const sideCode = `<script setup lang="ts">
const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
const weekData = [12, 18, 15, 22, 19, 25, 28];
<\/script>

<template>
  <Grid :gap="4">
    <GridItem :colSpan="12">
      <ChartCard
        title="新用户"
        value="2545"
        :trend="1.2"
        trend-suffix="较上周"
        period="过去7天"
        chart="line"
        layout="side"
        :data="weekData"
        :label="weekLabels"
      />
    </GridItem>
    <GridItem :colSpan="12">
      <ChartCard
        title="浏览量"
        value="15480"
        :trend="-4.15"
        period="过去7天"
        chart="bar"
        layout="side"
        :data="weekData"
        :label="weekLabels"
      />
    </GridItem>
  </Grid>
<\/template>`;

const layoutCode = `<script setup lang="ts">
const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
const weekData = [18, 22, 20, 28, 35, 32, 40];
const pieData = [68, 32];
const pieLabel = ['完成', '剩余'];
<\/script>

<template>
  <Grid :gap="4">
    <GridItem :colSpan="12">
      <ChartCard
        title="粉丝增长"
        value="8920"
        :trend="3.6"
        period="过去7天"
        chart="area"
        layout="bottom"
        chart-height="120px"
        :data="weekData"
        :label="weekLabels"
      />
    </GridItem>
    <GridItem :colSpan="12">
      <ChartCard
        title="完成率"
        value="68%"
        chart="pie"
        layout="side"
        :data="pieData"
        :label="pieLabel"
      />
    </GridItem>
  </Grid>
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
                <h2 class="doc-page__name">ChartCard 图表卡片</h2>
                <p class="doc-page__summary">
                    指标卡片 + 迷你图。支持 <code>chart</code>（line / bar / area / pie）、
                    <code>layout</code>（side 右侧小图 / bottom 底部大图）、趋势 <code>trend</code> 与周期文案。
                    图表主色默认跟随主题，适配浅色 / 深色。
                </p>
            </div>

            <DemoBlock
                id="side"
                title="侧边小图"
                description="layout=side"
                detail="左侧展示标题、数值与趋势，右侧为迷你折线 / 柱状图。"
                :code="sideCode"
                borderless-card
            >
                <SideChartCard />
            </DemoBlock>

            <DemoBlock
                id="layout"
                title="底部大图与饼图"
                description="bottom 布局与 pie"
                detail="bottom 适合更大图表区域；pie 以环形进度展示占比。"
                :code="layoutCode"
                :default-expanded="false"
                borderless-card
            >
                <LayoutChartCard />
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
