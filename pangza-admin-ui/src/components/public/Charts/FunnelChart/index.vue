<script setup lang="ts">
import { computed } from 'vue';
import type { EChartsOption } from 'echarts';
import Charts from '../index.vue';
import { useChartTheme } from '../useChartTheme';
import {
    createBrandPalette,
    mergeChartOption,
    normalizeChartData,
    normalizeChartLabel,
    toNameValueList,
} from '../utils';

const props = withDefaults(defineProps<{
    /** 数值数据 */
    data?: number[];
    /** 名称标签 */
    label?: string[];
    height?: string;
    width?: string;
    /** 自定义 echarts 配置 */
    option?: EChartsOption;
    /** 自定义主色，默认主题色 */
    color?: string;
}>(), {
    data: () => [],
    label: () => [],
    height: '100%',
    width: '100%',
});

const { brandColor, isDark } = useChartTheme(() => props.color);

/**
 * 默认漏斗图配置，可被 option 覆盖
 */
const chartOption = computed<EChartsOption>(() => {
    const data = normalizeChartData(props.data);
    const label = normalizeChartLabel(props.label);
    const list = toNameValueList(data, label);
    const palette = createBrandPalette(brandColor.value, list.length);

    const base: EChartsOption = {
        color: palette,
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}',
        },
        legend: {
            bottom: 0,
            textStyle: {
                color: isDark.value ? '#C3C3C3' : '#666666',
            },
        },
        series: [
            {
                type: 'funnel',
                left: '12%',
                top: 16,
                bottom: 48,
                width: '76%',
                minSize: '10%',
                maxSize: '100%',
                sort: 'descending',
                gap: 4,
                label: {
                    show: true,
                    position: 'inside',
                    color: '#fff',
                },
                itemStyle: {
                    borderColor: isDark.value ? '#1C1C1C' : '#fff',
                    borderWidth: 1,
                },
                data: list,
            },
        ],
    };
    return mergeChartOption(base, props.option);
});

defineOptions({
    name: 'FunnelChart',
    globalComponent: true,
});
</script>

<template>
    <Charts :option="chartOption" :height="height" :width="width" />
</template>
