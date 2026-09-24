<script setup lang='ts'>
import useMenuNavigate from '@/hooks/components/useMenuNavigate';
import type { MenuResult } from '@/types/api/menu';
import { computed } from 'vue';

const props = defineProps<{
    list: MenuResult[];
}>();

const { handleMenuClick, getVisibleChildren } = useMenuNavigate();

/** 可见菜单列表 */
const visibleMenus = computed(() => getVisibleChildren(props.list));

defineOptions({
    name: 'TopMenu',
});
</script>

<template>
    <template v-for="menu in visibleMenus" :key="menu.path">
        <t-submenu
            v-if="getVisibleChildren(menu.children).length"
            :value="menu.path"
            :title="menu.meta?.title"
        >
            <template v-if="menu.meta?.icon" #icon>
                <MyIcon :size="18" :name="menu.meta.icon" />
            </template>
            <TopMenu :list="menu.children!" />
        </t-submenu>
        <t-menu-item v-else :value="menu.path" @click="handleMenuClick(menu)">
            <template v-if="menu.meta?.icon" #icon>
                <MyIcon :size="18" :name="menu.meta.icon" />
            </template>
            {{ menu.meta?.title }}
        </t-menu-item>
    </template>
</template>
