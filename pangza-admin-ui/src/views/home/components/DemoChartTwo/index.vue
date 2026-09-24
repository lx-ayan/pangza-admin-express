<script setup lang='ts'>
import DefaultChart from '@/components/public/Charts/index.vue';
import { useChartTheme } from '@/components/public/Charts/useChartTheme';
import {
    createAreaGradient,
    createCartesianAxisOption,
    createSeriesGradient,
} from '@/components/public/Charts/utils';
import type { EChartsOption } from 'echarts';
import { computed } from 'vue';

const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const monthData = [120, 200, 150, 230, 160, 178, 130, 120, 220, 150, 160, 200];

const { brandColor, isDark } = useChartTheme();

/** 折线图配置，随深浅色与主题色自动更新 */
const chartOption = computed<EChartsOption>(() => {
    const axis = createCartesianAxisOption(isDark.value);
    return {
        ...axis,
        xAxis: {
            ...axis.xAxis,
            boundaryGap: false,
            data: monthLabels,
        },
        yAxis: {
            ...axis.yAxis,
            max: 250,
        },
        series: [
            {
                data: monthData,
                type: 'line',
                smooth: true,
                symbolSize: 0,
                color: createSeriesGradient(brandColor.value),
                itemStyle: {
                    borderRadius: [4, 4, 4, 4],
                },
                areaStyle: {
                    color: createAreaGradient(brandColor.value),
                },
            },
        ],
        grid: {
            left: '0%',
            bottom: '0%',
            right: '0%',
            top: '12%',
        },
    };
});
</script>

<template>
    <GridItem :colSpan="14">
        <t-card :bordered="false" style="height: 420px;">
            <div class="text-slate-900 dark:text-white/85 text-lg">
                销售趋势图
            </div>
            <div class="text-slate-400">
                今年增长 <span class="text-[var(--td-error-color)]">+15%</span>
            </div>

            <DefaultChart :option="chartOption" height="300px" />
        </t-card>
    </GridItem>
</template>
