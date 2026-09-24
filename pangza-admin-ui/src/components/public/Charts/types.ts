import type { EChartsOption } from 'echarts';

/**
 * 公共图表基础 props：默认传 data + label 即可展示
 */
export interface BaseChartProps {
    /** 数值数据 */
    data?: number[];
    /** 分类 / 名称标签 */
    label?: string[];
    /** 图表高度 */
    height?: string;
    /** 图表宽度 */
    width?: string;
    /** 自定义 echarts 配置，与默认配置深度合并 */
    option?: EChartsOption;
    /** 自定义主色，默认跟随系统主题色 */
    color?: string;
}

/**
 * 仪表盘额外支持单个数值
 */
export interface GaugeChartProps extends Omit<BaseChartProps, 'data' | 'label'> {
    /** 当前值，支持单个数字或数组（取第一项） */
    data?: number | number[];
    /** 名称标签 */
    label?: string | string[];
    /** 仪表盘最大值，默认 100 */
    max?: number;
}

/**
 * 折线图额外配置
 */
export interface LineChartProps extends BaseChartProps {
    /** 是否平滑曲线，默认 true */
    smooth?: boolean;
    /** 是否展示面积填充，默认 true */
    showArea?: boolean;
}

/**
 * 柱状图额外配置
 */
export interface BarChartProps extends BaseChartProps {
    /** 柱宽，默认 60% */
    barWidth?: string | number;
}
