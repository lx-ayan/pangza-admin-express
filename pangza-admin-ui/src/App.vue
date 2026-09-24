<script setup lang="ts">
import { ConfigProvider } from 'tdesign-vue-next';
import useColor from './hooks/components/useColor';
const { initTheme } = useColor();
initTheme();
</script>

<template>
  <ConfigProvider>
    <router-view />
  </ConfigProvider>
</template>

<style scoped></style>
