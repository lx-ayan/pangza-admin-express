<script setup lang='tsx'>
import useThemeStore from '@/store/themeStore';

const themeStore = useThemeStore();

const ShortLogo = () => {
    return <div class="text-[var(--td-brand-color)] text-xl">
        P
    </div>
}

const LongLogo = () => {
    return <div class="w-full text-[var(--td-brand-color)] text-xl text-center">
        Pangza Vue Admin
    </div>
}

</script>
<template>
    <div class="w-full">
        <LongLogo v-if="themeStore.layout == '1' || themeStore.layout == '3' || themeStore.layout == '4' || themeStore.layout == '5'">
        </LongLogo>

        <template v-else>
            <LongLogo v-if="!themeStore.isCollapsed">
            </LongLogo>
            <ShortLogo v-else />
        </template>
    </div>
</template>