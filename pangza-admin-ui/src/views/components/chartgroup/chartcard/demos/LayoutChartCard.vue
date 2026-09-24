<script setup lang="ts">
const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
const weekData = [18, 22, 20, 28, 35, 32, 40];
const pieData = [68, 32];
const pieLabel = ['完成', '剩余'];
</script>

<template>
    <Grid :gap="4">
        <GridItem :colSpan="12">
            <ChartCard
                title="粉丝增长"
                value="8920"
                :trend="3.6"
                period="过去7天"
                chart="area"
                layout="bottom"
                chart-height="120px"
                :data="weekData"
                :label="weekLabels"
            />
        </GridItem>
        <GridItem :colSpan="12">
            <ChartCard
                title="完成率"
                value="68%"
                chart="pie"
                layout="side"
                :data="pieData"
                :label="pieLabel"
            />
        </GridItem>
    </Grid>
</template>
