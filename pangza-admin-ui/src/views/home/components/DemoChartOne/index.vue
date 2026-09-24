<script setup lang='ts'>
import DefaultChart from '@/components/public/Charts/index.vue';
import { useChartTheme } from '@/components/public/Charts/useChartTheme';
import { createCartesianAxisOption, createSeriesGradient } from '@/components/public/Charts/utils';
import type { EChartsOption } from 'echarts';
import { computed } from 'vue';

const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const monthData = [120, 200, 150, 80, 70, 110, 130, 120, 220, 150, 80, 70];

const { brandColor, isDark } = useChartTheme();

/** 柱状图配置，随深浅色与主题色自动更新 */
const chartOption = computed<EChartsOption>(() => {
    const axis = createCartesianAxisOption(isDark.value);
    return {
        ...axis,
        xAxis: {
            ...axis.xAxis,
            data: monthLabels,
        },
        yAxis: {
            ...axis.yAxis,
            max: 250,
        },
        series: [
            {
                data: monthData,
                type: 'bar',
                barWidth: '60%',
                color: createSeriesGradient(brandColor.value),
                itemStyle: {
                    borderRadius: [4, 4, 4, 4],
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
    <GridItem :colSpan="10">
        <t-card :bordered="false" style="height: 420px;">
            <DefaultChart :option="chartOption" height="230px" />

            <div class="text-lg text-slate-900 dark:text-white mt-4">
                房产销售
            </div>
            <div class="text-slate-900 dark:text-white mt-1">
                同比增长 <span class="text-[var(--td-error-color)]">+23%</span>
            </div>
            <div class="text-gray-500">
                工作再多也要休息休息，Pangza Vue Admin 祝您早日成为销售大师。
            </div>

            <Grid class="mt-4 mb-5">
                <GridItem :colSpan="6">
                    <div class="text-2xl">
                        200
                    </div>
                    <div class="text-slate-500">
                        商机数
                    </div>
                </GridItem>
                <GridItem :colSpan="6">
                    <div class="text-2xl">
                        120
                    </div>
                    <div class="text-slate-500">
                        房源数
                    </div>
                </GridItem>
                <GridItem :colSpan="6">
                    <div class="text-2xl">
                        56
                    </div>
                    <div class="text-slate-500">
                        维护客户
                    </div>
                </GridItem>
                <GridItem :colSpan="6">
                    <div class="text-2xl">
                        20
                    </div>
                    <div class="text-slate-500">
                        带看数
                    </div>
                </GridItem>
            </Grid>
        </t-card>
    </GridItem>
</template>
