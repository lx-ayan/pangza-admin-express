<script setup lang='ts'>
import useThemeStore from '@/store/themeStore';
import LayoutOne from './components/Layout/LayoutOne/index.vue';
import LayoutTwo from './components/Layout/LayoutTwo/index.vue';
import LayoutThree from './components/Layout/LayoutThree/index.vue';
import LayoutFour from './components/Layout/LayoutFour/index.vue';
import LayoutFive from './components/Layout/LayoutFive/index.vue';

const themeStore = useThemeStore();

</script>

<template>
    <LayoutOne v-if="themeStore.layout === '1'" />
    <LayoutTwo v-if="themeStore.layout === '2'" />
    <LayoutThree v-if="themeStore.layout === '3'" />
    <LayoutFour v-if="themeStore.layout === '4'" />
    <LayoutFive v-if="themeStore.layout === '5'" />
</template>
