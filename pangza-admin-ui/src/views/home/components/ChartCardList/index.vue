<script setup lang="ts">
/** 首页图表卡片演示数据 */
const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
const weekData = [12, 18, 15, 22, 19, 25, 28];
const viewData = [30, 45, 28, 52, 40, 60, 48, 55];
const fansData = [18, 22, 20, 28, 35, 32, 40];
const pieData = [68, 32];
</script>

<template>
    <div>
        <div class="mb-3 text-base text-[var(--td-text-color-primary)]">图表卡片（小图）</div>
        <Grid :gap="4">
            <GridItem :colSpan="6">
                <ChartCard
                    title="新用户"
                    value="2545"
                    :trend="1.2"
                    period="过去7天"
                    chart="line"
                    layout="side"
                    :data="weekData"
                    :label="weekLabels"
                />
            </GridItem>
            <GridItem :colSpan="6">
                <ChartCard
                    title="浏览量"
                    value="15480"
                    :trend="-4.15"
                    period="过去14天"
                    chart="bar"
                    layout="side"
                    :data="viewData"
                    :label="weekLabels"
                />
            </GridItem>
            <GridItem :colSpan="6">
                <ChartCard
                    title="粉丝数"
                    value="2545"
                    :trend="1.2"
                    period="过去30天"
                    chart="area"
                    layout="side"
                    :data="fansData"
                    :label="weekLabels"
                />
            </GridItem>
            <GridItem :colSpan="6">
                <ChartCard
                    title="粉丝量"
                    value="36,358"
                    :trend="18"
                    trend-suffix="较去年"
                    chart="pie"
                    layout="side"
                    :data="pieData"
                    :label="['2022', '2021']"
                />
            </GridItem>
        </Grid>

        <div class="mt-6 mb-3 text-base text-[var(--td-text-color-primary)]">图表卡片（大图）</div>
        <Grid :gap="4">
            <GridItem :colSpan="6">
                <ChartCard
                    title="新用户"
                    value="2545"
                    :trend="1.2"
                    chart="line"
                    layout="bottom"
                    :data="weekData"
                    :label="weekLabels"
                />
            </GridItem>
            <GridItem :colSpan="6">
                <ChartCard
                    title="浏览量"
                    value="15480"
                    :trend="-4.15"
                    chart="bar"
                    layout="bottom"
                    :data="viewData"
                    :label="weekLabels"
                />
            </GridItem>
            <GridItem :colSpan="6">
                <ChartCard
                    title="粉丝数"
                    value="2545"
                    :trend="1.2"
                    chart="area"
                    layout="bottom"
                    :data="fansData"
                    :label="weekLabels"
                />
            </GridItem>
            <GridItem :colSpan="6">
                <ChartCard
                    title="粉丝量"
                    value="36,358"
                    :trend="-18"
                    trend-suffix="较2021年"
                    chart="pie"
                    layout="bottom"
                    :data="pieData"
                    :label="['12月', '11月']"
                />
            </GridItem>
        </Grid>
    </div>
</template>
