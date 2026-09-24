import type { EChartsOption } from 'echarts';

/** 图表卡片图表类型 */
export type ChartCardType = 'line' | 'bar' | 'area' | 'pie';

/** 图表卡片布局：右侧小图 / 底部大图 */
export type ChartCardLayout = 'side' | 'bottom';

export interface ChartCardProps {
    /** 主标题，如：新用户 */
    title?: string;
    /** 主数值展示，如：2545 */
    value?: string | number;
    /** 趋势百分比，正数为上涨、负数为下跌 */
    trend?: number;
    /** 趋势后缀文案，如：较去年 */
    trendSuffix?: string;
    /** 时间范围，如：过去7天（side 布局右下角） */
    period?: string;
    /** 图表类型 */
    chart?: ChartCardType;
    /** 布局 */
    layout?: ChartCardLayout;
    /** 图表数据 */
    data?: number[];
    /** 图表标签（饼图图例也会用到） */
    label?: string[];
    /** 自定义 echarts 配置 */
    option?: EChartsOption;
    /** 自定义主色 */
    color?: string;
    /** 卡片内图表高度 */
    chartHeight?: string;
}
