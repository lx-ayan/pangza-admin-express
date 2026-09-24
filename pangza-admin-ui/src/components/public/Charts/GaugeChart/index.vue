<script setup lang="ts">
import { computed } from 'vue';
import type { EChartsOption } from 'echarts';
import Charts from '../index.vue';
import { useChartTheme } from '../useChartTheme';
import {
    mergeChartOption,
    normalizeChartData,
    normalizeChartLabel,
} from '../utils';
import { mixColorByOption } from '@/utils/core/css';

const props = withDefaults(defineProps<{
    /** 当前值，支持单个数字或数组（取第一项） */
    data?: number | number[];
    /** 名称标签 */
    label?: string | string[];
    height?: string;
    width?: string;
    /** 自定义 echarts 配置 */
    option?: EChartsOption;
    /** 自定义主色，默认主题色 */
    color?: string;
    /** 仪表盘最大值 */
    max?: number;
}>(), {
    data: 0,
    label: '',
    height: '100%',
    width: '100%',
    max: 100,
});

const { brandColor, isDark } = useChartTheme(() => props.color);

/**
 * 默认仪表盘配置，可被 option 覆盖
 */
const chartOption = computed<EChartsOption>(() => {
    const values = normalizeChartData(props.data);
    const labels = normalizeChartLabel(props.label);
    const value = values[0] ?? 0;
    const name = labels[0] ?? '';
    const trackColor = isDark.value ? '#333333' : '#F0F2F5';

    const base: EChartsOption = {
        series: [
            {
                type: 'gauge',
                min: 0,
                max: props.max,
                startAngle: 210,
                endAngle: -30,
                progress: {
                    show: true,
                    width: 14,
                    itemStyle: {
                        color: brandColor.value,
                    },
                },
                axisLine: {
                    lineStyle: {
                        width: 14,
                        color: [[1, trackColor]],
                    },
                },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                pointer: {
                    show: true,
                    length: '55%',
                    width: 4,
                    itemStyle: {
                        color: brandColor.value,
                    },
                },
                anchor: {
                    show: true,
                    size: 10,
                    itemStyle: {
                        color: brandColor.value,
                    },
                },
                detail: {
                    valueAnimation: true,
                    fontSize: 28,
                    offsetCenter: [0, '24%'],
                    color: isDark.value ? '#FFFFFF' : '#16192C',
                    formatter: '{value}',
                },
                title: {
                    offsetCenter: [0, '48%'],
                    color: isDark.value ? '#C3C3C3' : '#999999',
                    fontSize: 13,
                },
                data: [
                    {
                        value,
                        name,
                    },
                ],
                itemStyle: {
                    color: mixColorByOption(brandColor.value),
                },
            },
        ],
    };
    return mergeChartOption(base, props.option);
});

defineOptions({
    name: 'GaugeChart',
    globalComponent: true,
});
</script>

<template>
    <Charts :option="chartOption" :height="height" :width="width" />
</template>
