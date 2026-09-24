<script setup lang='ts'>
import Header from '../../Header/index.vue';
import useColor from '@/hooks/components/useColor';
import Menu from '../../Menu/index.vue';
import useThemeStore from '@/store/themeStore';
import Tabs from '../../Header/components/Tab/index.vue';
const { layoutBackgroundColor } = useColor();
const themeStore = useThemeStore();
</script>
<template>
    <t-layout class="h-full">
        <t-header>
            <Header />
        </t-header>
        <t-layout :style="{ background: layoutBackgroundColor }" style="height: calc(100vh - 60px);overflow-x: hidden;">
            <t-aside ref="layoutRef" width="auto">
                <Menu />
            </t-aside>

            <t-content style="max-width: calc(100vw-232px); overflow-x: hidden;" class="p-4">
                <Tabs v-show="themeStore.showTab" />
                <div class="overflow-y-auto overflow-x-hidden" style="height: calc(100vh - 132px)">
                    <RouterView #default="{ Component, route }">
                        <Transition :name="themeStore.routerAnimateion" mode="out-in">
                            <component :is="Component" :key="route.path" />
                        </Transition>
                    </RouterView>
                </div>
            </t-content>
        </t-layout>
    </t-layout>
</template>