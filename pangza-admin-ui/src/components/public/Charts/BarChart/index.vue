<script setup lang="ts">
import { computed } from 'vue';
import type { EChartsOption } from 'echarts';
import Charts from '../index.vue';
import { useChartTheme } from '../useChartTheme';
import {
    createCartesianAxisOption,
    createSeriesGradient,
    mergeChartOption,
    normalizeChartData,
    normalizeChartLabel,
} from '../utils';

const props = withDefaults(defineProps<{
    /** 数值数据 */
    data?: number[];
    /** 分类标签 */
    label?: string[];
    height?: string;
    width?: string;
    /** 自定义 echarts 配置 */
    option?: EChartsOption;
    /** 自定义主色，默认主题色 */
    color?: string;
    /** 柱宽 */
    barWidth?: string | number;
}>(), {
    data: () => [],
    label: () => [],
    height: '100%',
    width: '100%',
    barWidth: '60%',
});

const { brandColor, isDark } = useChartTheme(() => props.color);

/**
 * 默认柱状图配置，可被 option 覆盖
 */
const chartOption = computed<EChartsOption>(() => {
    const data = normalizeChartData(props.data);
    const label = normalizeChartLabel(props.label);
    const axis = createCartesianAxisOption(isDark.value);
    const base: EChartsOption = {
        ...axis,
        xAxis: {
            ...axis.xAxis,
            data: label,
        },
        series: [
            {
                type: 'bar',
                data,
                barWidth: props.barWidth,
                color: createSeriesGradient(brandColor.value),
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                },
            },
        ],
    };
    return mergeChartOption(base, props.option);
});

defineOptions({
    name: 'BarChart',
    globalComponent: true,
});
</script>

<template>
    <Charts :option="chartOption" :height="height" :width="width" />
</template>
