<script setup lang='tsx'>
import DataCardList from './components/DataCardList/index.vue';
import DemoChartOne from './components/DemoChartOne/index.vue';
import DemoChartTwo from './components/DemoChartTwo/index.vue';
import DemoTable from './components/DemoTable/index.vue';
import DemoList from './components/DemoList/index.vue';

const menuOption = [
    { content: 'aaa', value: '11' },
    {
        content: () => <div>
            自定义渲染
        </div>,
        value: '22'
    }
]

function handleChoose(value) {
    console.log(value);
}

</script>
<template>
    <div>
        <DataCardList />
        <Grid :gap="6" class="mt-6">
            <DemoChartOne />

            <DemoChartTwo />
        </Grid>

        <Grid :gap="6" class="mt-6">
            <DemoTable />

            <DemoList />
        </Grid>
    </div>
</template>
