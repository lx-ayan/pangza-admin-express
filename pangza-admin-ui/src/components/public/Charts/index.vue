<script setup lang='ts'>
import * as echarts from 'echarts';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

let echartInstance: Nullable<echarts.ECharts> = null;

let observer: Nullable<ResizeObserver> = null;

const echartsContainer = ref<HTMLDivElement>();

const props = withDefaults(defineProps<{
    height?: string;
    width?: string;
    option?: any;
}>(), {
    height: '100%',
    width: '100%',
    option: () => ({})
});

/**
 * 初始化图表实例与尺寸监听
 */
const initChart = () => {
    nextTick(() => {
        if (!echartsContainer.value) {
            return;
        }
        echartInstance = echarts.init(echartsContainer.value);
        echartInstance.setOption(props.option, true);
        observer = new ResizeObserver(() => {
            echartInstance?.resize();
        });
        observer.observe(echartsContainer.value);
    })
};

/**
 * 销毁图表与观察器
 */
function destroy() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    echartInstance?.dispose();
    echartInstance = null;
}

watch(() => props.option, (value) => {
    echartInstance?.setOption(value, true);
}, { deep: true });

onMounted(() => initChart());

onUnmounted(() => destroy());

defineExpose({
    /** 强制按最新 option 重绘 */
    reload: () => {
        echartInstance?.clear();
        echartInstance?.setOption(props.option, true);
    },
    /** 获取 echarts 实例 */
    getInstance: () => echartInstance,
})

defineOptions({
    name: 'Charts',
})

</script>

<template>
    <div ref="echartsContainer" :style="{ height: props.height, width: props.width }">

    </div>
</template>
