<script setup lang="ts">
import { computed } from 'vue';
import type { EChartsOption } from 'echarts';
import Charts from '../index.vue';
import { useChartTheme } from '../useChartTheme';
import {
    createAreaGradient,
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
    /** 是否平滑曲线 */
    smooth?: boolean;
    /** 是否展示面积填充 */
    showArea?: boolean;
}>(), {
    data: () => [],
    label: () => [],
    height: '100%',
    width: '100%',
    smooth: true,
    showArea: true,
});

const { brandColor, isDark } = useChartTheme(() => props.color);

/**
 * 默认折线图配置，可被 option 覆盖
 */
const chartOption = computed<EChartsOption>(() => {
    const data = normalizeChartData(props.data);
    const label = normalizeChartLabel(props.label);
    const axis = createCartesianAxisOption(isDark.value);
    const base: EChartsOption = {
        ...axis,
        xAxis: {
            ...axis.xAxis,
            boundaryGap: false,
            data: label,
        },
        series: [
            {
                type: 'line',
                data,
                smooth: props.smooth,
                symbolSize: 0,
                color: createSeriesGradient(brandColor.value),
                areaStyle: props.showArea
                    ? { color: createAreaGradient(brandColor.value) }
                    : undefined,
            },
        ],
    };
    return mergeChartOption(base, props.option);
});

defineOptions({
    name: 'LineChart',
    globalComponent: true,
});
</script>

<template>
    <Charts :option="chartOption" :height="height" :width="width" />
</template>
