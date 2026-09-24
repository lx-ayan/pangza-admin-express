<script setup lang='ts'>

import Header from '../../Header/index.vue';

import useColor from '@/hooks/components/useColor';

import SplitMenu from '../../Menu/components/SplitMenu/index.vue';

import useThemeStore from '@/store/themeStore';

import Tabs from '../../Header/components/Tab/index.vue';



const themeStore = useThemeStore();

const { layoutBackgroundColor } = useColor();

</script>



<template>

    <t-layout class="layout-four h-full overflow-hidden">

        <t-header>

            <Header />

        </t-header>

        <t-layout :style="{ background: layoutBackgroundColor }" class="layout-four__body">

            <t-aside width="auto" class="layout-four__aside">

                <SplitMenu />

            </t-aside>

            <t-content class="layout-four__content">

                <Tabs v-show="themeStore.showTab" />

                <div class="layout-four__main">

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



<style scoped lang="scss">

.layout-four__body {

    height: calc(100vh - 60px);

    overflow: hidden;

}



.layout-four__aside {

    flex-shrink: 0;

    overflow: hidden;

}



.layout-four__content {

    display: flex;

    flex-direction: column;

    flex: 1;

    min-width: 0;

    padding: 16px;

    overflow: hidden;

    box-sizing: border-box;

}



.layout-four__main {

    flex: 1;

    min-height: 0;

    overflow-x: hidden;

    overflow-y: auto;

    scrollbar-gutter: stable;

}

</style>

