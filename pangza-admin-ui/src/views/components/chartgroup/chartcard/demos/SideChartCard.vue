<script setup lang="ts">
const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
const weekData = [12, 18, 15, 22, 19, 25, 28];
</script>

<template>
    <Grid :gap="4">
        <GridItem :colSpan="12">
            <ChartCard
                title="新用户"
                value="2545"
                :trend="1.2"
                trend-suffix="较上周"
                period="过去7天"
                chart="line"
                layout="side"
                :data="weekData"
                :label="weekLabels"
            />
        </GridItem>
        <GridItem :colSpan="12">
            <ChartCard
                title="浏览量"
                value="15480"
                :trend="-4.15"
                period="过去7天"
                chart="bar"
                layout="side"
                :data="weekData"
                :label="weekLabels"
            />
        </GridItem>
    </Grid>
</template>
