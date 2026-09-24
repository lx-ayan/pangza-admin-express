<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BarChartDemo from './demos/BarChartDemo.vue';
import LineChartDemo from './demos/LineChartDemo.vue';
import PieChartDemo from './demos/PieChartDemo.vue';
import GaugeChartDemo from './demos/GaugeChartDemo.vue';
import FunnelChartDemo from './demos/FunnelChartDemo.vue';

/** 锚点目录 */
const anchors = [
    { id: 'bar', title: '柱状图' },
    { id: 'line', title: '折线图' },
    { id: 'pie', title: '饼图' },
    { id: 'gauge', title: '仪表盘' },
    { id: 'funnel', title: '漏斗图' },
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

const barCode = `<script setup lang="ts">
const label = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const data = [120, 200, 150, 80, 70, 110, 130];
<\/script>

<template>
  <div class="h-[280px]">
    <BarChart :data="data" :label="label" height="100%" />
  </div>
<\/template>`;

const lineCode = `<script setup lang="ts">
const label = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const data = [82, 93, 90, 94, 120, 110, 130];
<\/script>

<template>
  <div class="h-[280px]">
    <LineChart
      :data="data"
      :label="label"
      height="100%"
      :smooth="true"
      :show-area="true"
    />
  </div>
<\/template>`;

const pieCode = `<script setup lang="ts">
const label = ['直接访问', '邮件营销', '联盟广告', '视频广告', '搜索引擎'];
const data = [335, 310, 234, 135, 1548];
<\/script>

<template>
  <div class="h-[280px]">
    <!-- donut：环形图；也可传 color / option 覆盖样式与配置 -->
    <PieChart :data="data" :label="label" height="100%" donut />
  </div>
<\/template>`;

const gaugeCode = `<script setup lang="ts">
// data 可为单个数值或数组（取第一项）
<\/script>

<template>
  <div class="h-[280px]">
    <GaugeChart
      :data="72"
      label="完成率"
      :max="100"
      height="100%"
    />
  </div>
<\/template>`;

const funnelCode = `<script setup lang="ts">
const label = ['访问', '点击', '咨询', '订单', '成交'];
const data = [100, 80, 60, 40, 20];
<\/script>

<template>
  <div class="h-[280px]">
    <FunnelChart :data="data" :label="label" height="100%" />
  </div>
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
                <h2 class="doc-page__name">Charts 图表组件</h2>
                <p class="doc-page__summary">
                    基于 ECharts 封装的一组图表：<code>BarChart</code>、<code>LineChart</code>、
                    <code>PieChart</code>、<code>GaugeChart</code>、<code>FunnelChart</code>。
                    默认传入 <code>data</code> + <code>label</code> 即可展示；可用 <code>option</code> 深度合并自定义配置，
                    <code>color</code> 覆盖主色。主题切换时会跟随系统浅色 / 深色。
                </p>
            </div>

            <DemoBlock
                id="bar"
                title="柱状图 BarChart"
                description="分类对比"
                detail="支持 barWidth、option 覆盖；高度由容器或 height 控制。"
                :code="barCode"
                borderless-card
            >
                <BarChartDemo />
            </DemoBlock>

            <DemoBlock
                id="line"
                title="折线图 LineChart"
                description="趋势展示"
                detail="smooth 控制平滑曲线，showArea 控制面积填充。"
                :code="lineCode"
                :default-expanded="false"
                borderless-card
            >
                <LineChartDemo />
            </DemoBlock>

            <DemoBlock
                id="pie"
                title="饼图 PieChart"
                description="占比展示"
                detail="设置 donut 可切换为环形图。"
                :code="pieCode"
                :default-expanded="false"
                borderless-card
            >
                <PieChartDemo />
            </DemoBlock>

            <DemoBlock
                id="gauge"
                title="仪表盘 GaugeChart"
                description="完成度展示"
                detail="data 可为单个数值；max 设置最大值，默认 100。"
                :code="gaugeCode"
                :default-expanded="false"
                borderless-card
            >
                <GaugeChartDemo />
            </DemoBlock>

            <DemoBlock
                id="funnel"
                title="漏斗图 FunnelChart"
                description="转化流程"
                detail="按 data / label 顺序从上到下展示漏斗层级。"
                :code="funnelCode"
                :default-expanded="false"
                borderless-card
            >
                <FunnelChartDemo />
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
