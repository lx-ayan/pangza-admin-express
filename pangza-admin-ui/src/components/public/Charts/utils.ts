import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import Color from 'color';
import { merge } from 'lodash-es';
import { mixColorByOption } from '@/utils/core/css';

/**
 * 规范化数值数据
 */
export function normalizeChartData(data?: number | number[]): number[] {
    if (data == null) {
        return [];
    }
    return Array.isArray(data) ? data : [data];
}

/**
 * 规范化标签数据
 */
export function normalizeChartLabel(label?: string | string[]): string[] {
    if (label == null) {
        return [];
    }
    return Array.isArray(label) ? label : [label];
}

/**
 * 坐标轴辅助线颜色（适配浅色 / 深色）
 */
export function getChartAxisColor(isDark: boolean | string) {
    return isDark ? '#444' : '#EDEDED';
}

/**
 * 根据主题色生成多色板（饼图、漏斗图等）
 */
export function createBrandPalette(brandColor: string, count: number): string[] {
    if (count <= 0) {
        return [];
    }
    const base = Color(brandColor);
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
        const rotate = count === 1 ? 0 : (360 / count) * i;
        const lighten = (i % 3) * 0.08;
        colors.push(base.rotate(rotate).lighten(lighten).hex());
    }
    return colors;
}

/**
 * 柱状 / 折线渐变色
 */
export function createSeriesGradient(brandColor: string) {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: mixColorByOption(brandColor) },
        { offset: 0.6, color: brandColor },
        { offset: 1, color: brandColor },
    ]);
}

/**
 * 折线面积渐变填充
 */
export function createAreaGradient(brandColor: string) {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: `${brandColor}44` },
        { offset: 0.7, color: `${brandColor}00` },
    ]);
}

/**
 * 笛卡尔坐标系公共轴样式
 */
export function createCartesianAxisOption(isDark: boolean | string) {
    const axisColor = getChartAxisColor(isDark);
    return {
        xAxis: {
            type: 'category' as const,
            axisTick: { show: false },
            axisPointer: { show: false },
            axisLabel: { color: '#999999' },
            axisLine: {
                show: true,
                lineStyle: {
                    color: axisColor,
                    type: 'dashed' as const,
                },
            },
        },
        yAxis: {
            type: 'value' as const,
            axisTick: { show: false },
            axisPointer: { show: false },
            axisLabel: { color: '#999999' },
            axisLine: { show: false },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed' as const,
                    color: axisColor,
                },
            },
        },
        grid: {
            left: '2%',
            right: '2%',
            bottom: '2%',
            top: '8%',
            containLabel: true,
        },
        tooltip: {
            trigger: 'axis' as const,
        },
    };
}

/**
 * 将 name/value 列表转为饼图 / 漏斗图数据
 */
export function toNameValueList(data: number[], label: string[]) {
    const len = Math.max(data.length, label.length);
    const list: Array<{ name: string; value: number }> = [];
    for (let i = 0; i < len; i++) {
        list.push({
            name: label[i] ?? `项${i + 1}`,
            value: data[i] ?? 0,
        });
    }
    return list;
}

/**
 * 深度合并默认配置与用户自定义配置
 */
export function mergeChartOption(base: EChartsOption, custom?: EChartsOption): EChartsOption {
    if (!custom) {
        return base;
    }
    return merge({}, base, custom);
}
