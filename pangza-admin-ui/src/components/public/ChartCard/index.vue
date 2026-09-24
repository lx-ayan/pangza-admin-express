<script setup lang="ts">
import { computed } from 'vue';
import type { EChartsOption } from 'echarts';
import { merge } from 'lodash-es';
import useThemeStore from '@/store/themeStore';
import BarChart from '@/components/public/Charts/BarChart/index.vue';
import LineChart from '@/components/public/Charts/LineChart/index.vue';
import PieChart from '@/components/public/Charts/PieChart/index.vue';
import type { ChartCardLayout, ChartCardType } from './types';

const props = withDefaults(defineProps<{
    /** 主标题 */
    title?: string;
    /** 主数值 */
    value?: string | number;
    /** 趋势百分比，正涨负跌 */
    trend?: number;
    /** 趋势后缀，如：较去年 */
    trendSuffix?: string;
    /** 时间范围文案 */
    period?: string;
    /** 图表类型：line / bar / area / pie */
    chart?: ChartCardType;
    /** 布局：side 右侧小图，bottom 底部大图 */
    layout?: ChartCardLayout;
    /** 图表数据 */
    data?: number[];
    /** 图表标签 */
    label?: string[];
    /** 自定义 echarts 配置 */
    option?: EChartsOption;
    /** 自定义主色 */
    color?: string;
    /** 图表高度 */
    chartHeight?: string;
}>(), {
    title: '',
    value: '',
    chart: 'line',
    layout: 'side',
    data: () => [],
    label: () => [],
    chartHeight: '',
});

defineOptions({
    name: 'ChartCard',
    globalComponent: true,
});

const themeStore = useThemeStore();

const isSide = computed(() => props.layout === 'side');
const isPie = computed(() => props.chart === 'pie');

/** 趋势是否上涨 */
const isUp = computed(() => (props.trend ?? 0) >= 0);

/** 趋势展示文案 */
const trendText = computed(() => {
    if (props.trend == null) {
        return '';
    }
    const prefix = props.trend > 0 ? '+' : '';
    const suffix = props.trendSuffix ? ` ${props.trendSuffix}` : '';
    return `${prefix}${props.trend}%${suffix}`;
});

/** 默认图表高度 */
const resolvedChartHeight = computed(() => {
    if (props.chartHeight) {
        return props.chartHeight;
    }
    if (isPie.value) {
        return isSide.value ? '96px' : '100%';
    }
    // 底部大图随卡片剩余高度拉伸，避免底部留白
    return isSide.value ? '52px' : '100%';
});

/**
 * 精简坐标轴，做成卡片内迷你图
 */
const sparkOption = computed<EChartsOption>(() => {
    const hiddenAxis = {
        show: false,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
    };
    const trackColor = themeStore.isDarkMode ? '#3A3A3A' : '#E8EBF0';
    const base: EChartsOption = isPie.value
        ? {
            color: [themeStore.brandColor, trackColor],
            legend: { show: false },
            series: [
                {
                    type: 'pie',
                    radius: ['62%', '86%'],
                    center: ['50%', '50%'],
                    label: { show: false },
                    labelLine: { show: false },
                },
            ],
            tooltip: { show: false },
        }
        : {
            grid: {
                left: 0,
                right: 0,
                top: 4,
                bottom: 0,
                containLabel: false,
            },
            xAxis: hiddenAxis,
            yAxis: hiddenAxis,
            tooltip: { show: false },
            series: [
                {
                    type: props.chart === 'bar' ? 'bar' : 'line',
                    symbolSize: 0,
                    barWidth: isSide.value ? '45%' : '50%',
                    itemStyle: {
                        borderRadius: props.chart === 'bar' ? [3, 3, 0, 0] : undefined,
                    },
                },
            ],
        };
    return merge({}, base, props.option || {});
});

/** 饼图图例项 */
const legendItems = computed(() => {
    return (props.label || []).map((name, index) => ({
        name,
        value: props.data?.[index] ?? 0,
    }));
});
</script>

<template>
    <div
        class="chart-card"
        :class="{
            'chart-card--side': isSide,
            'chart-card--bottom': !isSide,
            'chart-card--pie': isPie,
        }"
    >
        <div class="chart-card__main">
            <div class="chart-card__meta">
                <div v-if="isPie" class="chart-card__pie-title">{{ title }}</div>
                <div class="chart-card__value">{{ value }}</div>
                <div v-if="!isPie" class="chart-card__title">{{ title }}</div>

                <div v-if="trend != null" class="chart-card__trend" :class="isUp ? 'is-up' : 'is-down'">
                    {{ trendText }}
                </div>

                <div v-if="isPie && legendItems.length" class="chart-card__legend">
                    <span v-for="item in legendItems" :key="item.name" class="chart-card__legend-item">
                        <i class="chart-card__legend-dot" />
                        {{ item.name }}
                    </span>
                </div>
            </div>

            <div v-if="isSide || isPie" class="chart-card__chart chart-card__chart--inline">
                <LineChart
                    v-if="chart === 'line' || chart === 'area'"
                    :data="data"
                    :label="label"
                    :show-area="chart === 'area'"
                    :color="color"
                    :option="sparkOption"
                    :height="resolvedChartHeight"
                />
                <BarChart
                    v-else-if="chart === 'bar'"
                    :data="data"
                    :label="label"
                    :color="color"
                    :option="sparkOption"
                    :height="resolvedChartHeight"
                />
                <PieChart
                    v-else
                    donut
                    :data="data"
                    :label="label"
                    :color="color"
                    :option="sparkOption"
                    :height="resolvedChartHeight"
                />
            </div>
        </div>

        <div v-if="isSide && !isPie" class="chart-card__footer">
            <span class="chart-card__trend chart-card__trend--footer" :class="isUp ? 'is-up' : 'is-down'">
                <template v-if="trend != null">{{ trendText }}</template>
            </span>
            <span class="chart-card__period">{{ period }}</span>
        </div>

        <div v-if="!isSide && !isPie" class="chart-card__chart chart-card__chart--bottom">
            <LineChart
                v-if="chart === 'line' || chart === 'area'"
                :data="data"
                :label="label"
                :show-area="chart === 'area'"
                :color="color"
                :option="sparkOption"
                :height="resolvedChartHeight"
            />
            <BarChart
                v-else-if="chart === 'bar'"
                :data="data"
                :label="label"
                :color="color"
                :option="sparkOption"
                :height="resolvedChartHeight"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
.chart-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px 18px;
    border-radius: 12px;
    background: var(--td-bg-color-container);
    box-sizing: border-box;
}

.chart-card__main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
}

.chart-card__meta {
    flex: 1;
    min-width: 0;
}

.chart-card__value {
    font-size: 26px;
    line-height: 1.2;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.chart-card__title,
.chart-card__pie-title {
    margin-top: 4px;
    font-size: 13px;
    color: var(--td-text-color-secondary);
}

.chart-card__pie-title {
    margin-top: 0;
    margin-bottom: 4px;
}

.chart-card__trend {
    margin-top: 8px;
    font-size: 13px;
    font-weight: 500;

    &.is-up {
        color: var(--td-success-color);
    }

    &.is-down {
        color: var(--td-error-color);
    }

    &--footer {
        margin-top: 0;
    }
}

.chart-card__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
}

.chart-card__legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--td-text-color-secondary);
}

.chart-card__legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: v-bind('themeStore.brandColor');
    opacity: 0.85;

    .chart-card__legend-item:nth-child(2) & {
        opacity: 0.35;
    }
}

.chart-card__chart {
    flex-shrink: 0;

    &--inline {
        width: 40%;
        max-width: 128px;
        min-width: 88px;
    }

    &--bottom {
        flex: 1;
        width: 100%;
        min-height: 96px;
        margin-top: 12px;
    }
}

.chart-card__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: auto;
    padding-top: 12px;
}

.chart-card__period {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
}

.chart-card--side {
    .chart-card__main {
        flex: 1;
    }

    &:not(.chart-card--pie) {
        .chart-card__trend:not(.chart-card__trend--footer) {
            display: none;
        }
    }
}

.chart-card--bottom:not(.chart-card--pie) {
    .chart-card__meta {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-areas:
            'value trend'
            'title trend';
        column-gap: 12px;
        align-items: start;
    }

    .chart-card__value {
        grid-area: value;
    }

    .chart-card__title {
        grid-area: title;
    }

    .chart-card__trend {
        grid-area: trend;
        margin-top: 0;
        align-self: center;
        text-align: right;
    }
}

.chart-card--pie {
    .chart-card__main {
        flex: 1;
        align-items: center;
    }

    .chart-card__chart--inline {
        width: 44%;
        max-width: 140px;
        align-self: center;
    }

    &.chart-card--bottom {
        .chart-card__chart--inline {
            width: 48%;
            max-width: 160px;
            min-width: 112px;
            height: 100%;
            min-height: 120px;
        }
    }
}
</style>
