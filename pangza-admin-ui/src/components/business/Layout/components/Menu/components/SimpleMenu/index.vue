<script setup lang='ts'>
import useMenuNavigate from '@/hooks/components/useMenuNavigate';
import useThemeStore from '@/store/themeStore';
import type { MenuResult } from '@/types/api/menu';
import { computed } from 'vue';

const themeStore = useThemeStore();
const { handleMenuClick, getVisibleChildren } = useMenuNavigate();

const props = defineProps<{
    list: MenuResult[]
}>();

/** 可见菜单列表 */
const visibleMenus = computed(() => getVisibleChildren(props.list));

/** 菜单图标尺寸 */
const iconSize = computed(() => {
    if (themeStore.layout === '3') {
        return 18;
    }
    return themeStore.isCollapsed ? 24 : 18;
});

defineOptions({
    name: 'SimpleMenu'
});
</script>
<template>
    <template v-for="menu in visibleMenus" :key="menu.path">
        <t-submenu :value="menu.path" v-if="getVisibleChildren(menu.children).length"
            :title="menu.meta?.title">
            <template v-if="menu.meta?.icon" #icon>
                <MyIcon :size="iconSize" class="mr-2" :name="menu.meta.icon"></MyIcon>
            </template>
            <SimpleMenu :list="menu.children!"></SimpleMenu>
        </t-submenu>
        <t-menu-item @click="() => handleMenuClick(menu)" :value="menu.path" v-else>
            <template v-if="menu.meta?.icon" #icon>
                <MyIcon :size="iconSize" class="mr-2" :name="menu.meta.icon"></MyIcon>
            </template>
            {{ menu.meta?.title }}
        </t-menu-item>
    </template>
</template>
