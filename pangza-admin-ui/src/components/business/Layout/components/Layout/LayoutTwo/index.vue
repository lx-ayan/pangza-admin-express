<script setup lang='ts'>
import Header from '../../Header/index.vue';
import useColor from '@/hooks/components/useColor';
import Menu from '../../Menu/index.vue';
import useThemeStore from '@/store/themeStore';
import Tabs from '../../Header/components/Tab/index.vue';

const themeStore = useThemeStore();

const { layoutBackgroundColor } = useColor();
</script>

<template>
    <t-layout class="layout-two h-full overflow-hidden">
        <t-aside width="auto" class="layout-two__aside h-full">
            <Menu />
        </t-aside>
        <t-layout :style="{ background: layoutBackgroundColor }" class="layout-two__body">
            <t-header>
                <Header />
            </t-header>
            <t-content class="layout-two__content">
                <Tabs v-show="themeStore.showTab" />
                <div class="layout-two__main">
                    <RouterView #default="{ Component, route }">
                        <Transition :name="themeStore.routerAnimateion" mode="out-in">
                            <div :key="route.path" class="layout-two__page">
                                <component :is="Component" />
                            </div>
                        </Transition>
                    </RouterView>
                </div>
            </t-content>
        </t-layout>
    </t-layout>
</template>

<style scoped lang="scss">
.layout-two__aside {
    flex-shrink: 0;
    overflow: hidden;
}

.layout-two__body {
    flex: 1;
    min-width: 0;
    height: 100vh;
    overflow: hidden;
}

.layout-two__content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 16px;
    overflow: hidden;
    box-sizing: border-box;
}

.layout-two__main {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.layout-two__page {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
}
</style>
