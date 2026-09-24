<script setup lang='ts'>
import useUserStore from '@/store/userStore';
import SimpleMenu from './components/SimpleMenu/index.vue';
import { useRoute } from 'vue-router';
import useThemeStore from '@/store/themeStore';
import Logo from '../Header/components/Logo/index.vue';
import type { MenuResult } from '@/types/api/menu';
import { computed } from 'vue';

const props = defineProps<{
    list?: MenuResult[];
}>();

const themeStore = useThemeStore();

const userStore = useUserStore();

const route = useRoute();

const menuList = computed(() => props.list ?? userStore.menuList);
</script>
<template>
    <t-menu
        :key="`${themeStore.menuTheme}-${themeStore.theme}`"
        :theme="themeStore.menuTheme"
        class="h-full"
        v-model:collapsed="themeStore.isCollapsed"
        :expand-mutex="themeStore.menuAccordion"
        :value="route.fullPath"
    >
        <template v-if="themeStore.layout == '2'" #logo>
            <Logo />
        </template>
        <SimpleMenu :list="menuList" />
    </t-menu>
</template>

<style>
.t-menu__logo:not(:empty) {
    border-bottom: none !important;
}
</style>