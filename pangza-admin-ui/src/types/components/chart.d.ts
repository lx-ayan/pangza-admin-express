import type { EChartsOption } from 'echarts';

export interface BasicChartProps {
    width?: string;
    height?: string;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
}

export interface DefaultChartProps extends BasicChartProps {
    option: EChartsOption
}

export interface BarChartProps extends BasicChartProps {
    data: Array<number[]>;
    color?: string[];
    xdata?: string[];
    showLine?: boolean;
}