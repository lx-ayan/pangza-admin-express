<script setup lang='ts'>
import UserDropdown from './components/UserDropdown/index.vue';
import ThemeDrawer from './components/ThemeDrawer/index.vue';
import useThemeStore from '@/store/themeStore';
import Logo from './components/Logo/index.vue';
import { IndentLeftIcon, IndentRightIcon } from 'tdesign-icons-vue-next';
const themeStore = useThemeStore();
</script>
<template>
    <div class="h-[60px] flex items-center justify-between pr-4">
        <div class="flex items-center">
            <div v-if="themeStore.layout === '1'" class="w-[236px]">
                <Logo />
            </div>
            <div v-else-if="themeStore.layout === '4'" class="w-[304px]">
                <Logo />
            </div>
            <div>

                <t-button v-show="themeStore.showCollaspedButton && (themeStore.layout === '1' || themeStore.layout === '2')"
                    @click="() => themeStore.setCollapsed(!themeStore.isCollapsed)" variant="text" shape="circle">
                    <indent-right-icon v-if="themeStore.isCollapsed" :fill-color='"transparent"'
                        :stroke-color='"currentColor"' :stroke-width="2" />
                    <indent-left-icon v-else :fill-color='"transparent"' :stroke-color='"currentColor"'
                        :stroke-width="2" />
                </t-button>
            </div>
        </div>

        <div class="flex items-center">
            <div class="mr-2">
                <ThemeDrawer />
            </div>
            <div>
                <UserDropdown />
            </div>
        </div>
    </div>
</template>