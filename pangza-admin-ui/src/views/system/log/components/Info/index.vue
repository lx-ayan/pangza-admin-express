<script setup lang='ts'>
import RenderColumn from '@/components/public/RenderColumn';
import { filterByValue } from '@/utils/core';
import { LOG_BUSINESS, LOG_OPER } from '@/utils/data/constant';


const props = defineProps<{
    data: any
}>();
</script>
<template>
    <GrayCard>
        <Grid :cols="5">
            <GridItem>
                <RenderColumn :data="props.data.title" title="操作名称"></RenderColumn>
            </GridItem>
            <GridItem>
                <RenderColumn :data="props.data.username" title="操作人"></RenderColumn>
            </GridItem>
            <GridItem>
                <RenderColumn :data="props.data.createTime" title="操作时间"></RenderColumn>
            </GridItem>
            <GridItem>
                <RenderColumn :data="props.data.ip" title="操作 ip"></RenderColumn>
            </GridItem>
            <GridItem>
                <RenderColumn title="请求状态">
                    <template #data>
                        <CircleTag animation :color="props.data.status == '200' ? '#35B076' : '#F06161'">
                            {{ props.data.status == '200' ? '成功' : '失败' }}
                        </CircleTag>
                    </template>
                </RenderColumn>
            </GridItem>
        </Grid>
    </GrayCard>
    <GrayCard class="mt-5">
        <Grid :gap="4" :cols="5">
            <GridItem>
                <RenderColumn :data="props.data.url" title="请求路径"></RenderColumn>
            </GridItem>
            <GridItem>
                <RenderColumn :data="props.data.methodName" title="请求方式"></RenderColumn>
            </GridItem>
            <GridItem>
                <RenderColumn :data="props.data.createTime" title="业务类型">
                    <template #data>
                        <div>
                            {{ filterByValue(LOG_BUSINESS, props.data.business) }}
                        </div>
                    </template>
                </RenderColumn>
            </GridItem>
            <GridItem>
                <RenderColumn :data="props.data.timeLong" title="请求耗时(ms)"></RenderColumn>
            </GridItem>
            <GridItem>
                <RenderColumn title="请求设备">
                    <template #data>
                        <div>
                            {{ filterByValue(LOG_OPER, props.data.oper) }}
                        </div>
                    </template>
                </RenderColumn>
            </GridItem>

            <GridItem :colSpan="2">
                <RenderColumn title="后端方法">
                    <template #data>
                        <div>
                            {{ props.data.controllerName }}
                        </div>
                    </template>
                </RenderColumn>
            </GridItem>


            <GridItem>
                <RenderColumn title="请求地址">
                    <template #data>
                        <div>
                            {{ props.data.address }}
                        </div>
                    </template>
                </RenderColumn>
            </GridItem>
        </Grid>
    </GrayCard>
    <div class="mt-5">
        入参
    </div>
    <GrayCard>
        <code>
        {{ props.data.params }}
    </code>
    </GrayCard>

    <div class="mt-5">
        返回
    </div>
    <GrayCard>
        <code>
        {{ props.data.response }}
    </code>
    </GrayCard>

    <div v-if="props.data.errorMessage" class="mt-5">
        错误信息
    </div>
    <GrayCard v-if="props.data.errorMessage">
        <code>
        {{ props.data.errorMessage }}
    </code>
    </GrayCard>
</template>