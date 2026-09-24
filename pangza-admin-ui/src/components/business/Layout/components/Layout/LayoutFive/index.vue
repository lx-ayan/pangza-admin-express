<script setup lang='ts'>
import useColor from '@/hooks/components/useColor';
import { provideHybridMenu } from '@/hooks/components/useHybridMenu';
import Menu from '../../Menu/index.vue';
import HybridTopMenu from '../../Menu/components/HybridTopMenu/index.vue';
import Logo from '../../Header/components/Logo/index.vue';
import ThemeDrawer from '../../Header/components/ThemeDrawer/index.vue';
import UserDropdown from '../../Header/components/UserDropdown/index.vue';
import Tabs from '../../Header/components/Tab/index.vue';
import useThemeStore from '@/store/themeStore';

const themeStore = useThemeStore();
const { layoutBackgroundColor } = useColor();
const { activeParentPath, hasChildPanel, activeChildren } = provideHybridMenu();
</script>

<template>
    <t-layout class="layout-five h-full overflow-hidden">
        <t-header height="60px" class="layout-five__header">
            <t-head-menu
                class="layout-five__menu"
                expand-type="popup"
                :theme="themeStore.menuTheme"
                :value="activeParentPath"
                :expand-mutex="themeStore.menuAccordion"
            >
                <template #logo>
                    <Logo />
                </template>
                <HybridTopMenu />
                <template #operations>
                    <div class="layout-five__operations">
                        <ThemeDrawer />
                        <UserDropdown />
                    </div>
                </template>
            </t-head-menu>
        </t-header>

        <t-layout :style="{ background: layoutBackgroundColor }" class="layout-five__body">
            <t-aside v-if="hasChildPanel" width="auto" class="layout-five__aside h-full">
                <Menu :list="activeChildren" />
            </t-aside>
            <t-content class="layout-five__content">
                <Tabs v-show="themeStore.showTab" />
                <div class="layout-five__main">
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
.layout-five__header {
    padding: 0;
    overflow: visible;
}

.layout-five__menu {
    height: 60px;

    :deep(.t-head-menu__inner) {
        height: 60px;
    }
}

.layout-five__operations {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-right: 16px;
}

.layout-five__body {
    height: calc(100vh - 60px);
    overflow: hidden;
}

.layout-five__aside {
    flex-shrink: 0;
    overflow: hidden;
}

.layout-five__content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    padding: 16px;
    overflow: hidden;
    box-sizing: border-box;
}

.layout-five__main {
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-gutter: stable;
}
</style>
