<script setup lang='ts'>
import { useHybridMenu } from '@/hooks/components/useHybridMenu';

const { menuList, handleTopMenuClick } = useHybridMenu();

defineOptions({
    name: 'HybridTopMenu',
});
</script>

<template>
    <t-menu-item
        v-for="menu in menuList"
        :key="menu.path"
        :value="menu.path"
        @click="handleTopMenuClick(menu)"
    >
        <template v-if="menu.meta?.icon" #icon>
            <MyIcon :size="18" :name="menu.meta.icon" />
        </template>
        {{ menu.meta?.title }}
    </t-menu-item>
</template>
