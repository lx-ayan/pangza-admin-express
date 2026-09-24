<script setup lang='ts'>
import useColor from '@/hooks/components/useColor';
import TopMenu from '../../Menu/components/TopMenu/index.vue';
import Logo from '../../Header/components/Logo/index.vue';
import ThemeDrawer from '../../Header/components/ThemeDrawer/index.vue';
import UserDropdown from '../../Header/components/UserDropdown/index.vue';
import useThemeStore from '@/store/themeStore';
import useUserStore from '@/store/userStore';
import Tabs from '../../Header/components/Tab/index.vue';
import { useRoute } from 'vue-router';

const { layoutBackgroundColor } = useColor();
const themeStore = useThemeStore();
const userStore = useUserStore();
const route = useRoute();
</script>

<template>
    <t-layout class="layout-three h-full overflow-hidden">
        <t-header height="60px" class="layout-three__header">
            <t-head-menu
                class="layout-three__menu"
                expand-type="popup"
                :theme="themeStore.menuTheme"
                :value="route.fullPath"
                :expand-mutex="themeStore.menuAccordion"
            >
                <template #logo>
                    <Logo />
                </template>
                <TopMenu :list="userStore.menuList" />
                <template #operations>
                    <div class="layout-three__operations">
                        <ThemeDrawer />
                        <UserDropdown />
                    </div>
                </template>
            </t-head-menu>
        </t-header>

        <t-layout :style="{ background: layoutBackgroundColor }" class="layout-three__body">
            <t-content class="layout-three__content">
                <Tabs v-show="themeStore.showTab" />
                <div class="layout-three__main">
                    <RouterView #default="{ Component, route: currentRoute }">
                        <Transition :name="themeStore.routerAnimateion" mode="out-in">
                            <component :is="Component" :key="currentRoute.path" />
                        </Transition>
                    </RouterView>
                </div>
            </t-content>
        </t-layout>
    </t-layout>
</template>

<style scoped lang="scss">
.layout-three__header {
    padding: 0;
    overflow: visible;
}

.layout-three__menu {
    height: 60px;

    :deep(.t-head-menu__inner) {
        height: 60px;
    }
}

.layout-three__operations {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-right: 16px;
}

.layout-three__body {
    height: calc(100vh - 60px);
    overflow: hidden;
}

.layout-three__content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;
    overflow: hidden;
    box-sizing: border-box;
}

.layout-three__main {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-gutter: stable;
}
</style>
