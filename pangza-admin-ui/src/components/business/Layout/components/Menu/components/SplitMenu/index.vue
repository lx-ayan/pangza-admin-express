<script setup lang='ts'>
import useMenuNavigate from '@/hooks/components/useMenuNavigate';
import useThemeStore from '@/store/themeStore';
import useUserStore from '@/store/userStore';
import type { MenuResult } from '@/types/api/menu';
import SimpleMenu from '../SimpleMenu/index.vue';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const themeStore = useThemeStore();
const userStore = useUserStore();
const route = useRoute();

const {
    handleMenuClick,
    findActiveParentPath,
    getVisibleChildren,
} = useMenuNavigate();

const activeParentPath = ref('');

const menuList = computed(() => getVisibleChildren(userStore.menuList));

const activeParent = computed(() => {
    return menuList.value.find((menu) => menu.path === activeParentPath.value);
});

const activeChildren = computed(() => getVisibleChildren(activeParent.value?.children));

/** 是否展示右侧子菜单栏 */
const hasChildPanel = computed(() => activeChildren.value.length > 0);

watch(
    () => [route.fullPath, menuList.value] as const,
    () => {
        activeParentPath.value = findActiveParentPath(menuList.value, route.fullPath);
    },
    { immediate: true },
);

/**
 * 切换左侧父级菜单；无子级时直接跳转
 */
function handleParentClick(menu: MenuResult) {
    activeParentPath.value = menu.path;
    if (!getVisibleChildren(menu.children).length) {
        handleMenuClick(menu);
    }
}

defineOptions({
    name: 'SplitMenu',
});
</script>

<template>
    <div
        class="split-menu"
        :class="[
            `split-menu--${themeStore.menuTheme}`,
            { 'split-menu--solo': !hasChildPanel },
        ]"
    >
        <div class="split-menu__parent">
            <div
                v-for="menu in menuList"
                :key="menu.path"
                class="split-menu__parent-item"
                :class="{ 'is-active': activeParentPath === menu.path }"
                @click="handleParentClick(menu)"
            >
                <MyIcon
                    v-if="menu.meta?.icon"
                    :size="18"
                    :name="menu.meta.icon"
                    class="split-menu__parent-icon"
                />
                <span class="split-menu__parent-title">{{ menu.meta?.title }}</span>
            </div>
        </div>

        <div v-if="hasChildPanel" class="split-menu__child">
            <t-menu
                class="split-menu__child-menu h-full"
                :theme="themeStore.menuTheme"
                :value="route.fullPath"
                :expand-mutex="themeStore.menuAccordion"
            >
                <SimpleMenu :list="activeChildren" />
            </t-menu>
        </div>
    </div>
</template>

<style lang="scss">
.split-menu {
    display: flex;
    height: 100%;
    width: 304px;
    flex-shrink: 0;
    border-right: 1px solid var(--td-component-border);
    background: var(--td-bg-color-container);
    transition: width 0.2s ease;
}

.split-menu--solo {
    width: 72px;
}

.split-menu__parent {
    display: flex;
    flex-direction: column;
    width: 72px;
    flex-shrink: 0;
    padding: 8px 6px;
    gap: 4px;
    box-sizing: border-box;
    border-right: 1px solid var(--td-component-border);
}

.split-menu--solo .split-menu__parent {
    width: 100%;
    border-right: none;
}

.split-menu__parent-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 64px;
    padding: 8px 4px;
    border-radius: var(--td-radius-default);
    color: var(--td-text-color-secondary);
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;

    &:hover {
        color: var(--td-text-color-primary);
        background: var(--td-bg-color-container-hover);
    }

    &.is-active {
        color: var(--td-brand-color);
        background: var(--td-brand-color-light);
    }
}

.split-menu__parent-icon {
    flex-shrink: 0;
}

.split-menu__parent-title {
    font-size: 12px;
    line-height: 1.2;
    text-align: center;
    word-break: break-all;
}

.split-menu__child {
    width: 232px;
    flex-shrink: 0;
    min-height: 0;
    overflow-y: auto;
}

.split-menu__child-menu {
    width: 232px;
    border-right: none;
}

.split-menu--dark {
    .split-menu__parent-item {
        color: var(--td-font-white-2);

        &:hover {
            color: var(--td-font-white-1);
            background: var(--td-bg-color-container-hover);
        }

        &.is-active {
            color: var(--td-text-color-anti);
            background: var(--td-brand-color);
        }
    }
}
</style>
