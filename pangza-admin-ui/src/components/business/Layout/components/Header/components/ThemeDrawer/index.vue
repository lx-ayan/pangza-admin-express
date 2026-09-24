<script setup lang="ts">
import useThemeStore from '@/store/themeStore';
import { ROUTER_ANIMATION_DATA } from '@/utils/data/constant';
import { THEME_SKIN_PRESETS } from '@/utils/data/themeSkin';
import ThemeConfigModal from './components/ThemeConfigModal/index.vue';
import { computed, ref } from 'vue';

const themeStore = useThemeStore();
const visible = ref(false);
const skinModalVisible = ref(false);

const currentSkinName = computed(() => {
    if (themeStore.skin === 'custom') {
        return 'Custom';
    }
    return THEME_SKIN_PRESETS.find((item) => item.id === themeStore.skin)?.name ?? 'TDesign';
});

function handleClick(key: string, state: any) {
    if (key === 'dark') {
        themeStore.setDark(state);
    }

    if (key === 'layout') {
        themeStore.setLayout(state);
    }

    if (key === 'menu') {
        themeStore.setMenuTheme(state);
    }
}
</script>

<template>
    <div>
        <t-drawer size="420px" header="主题设置" v-model:visible="visible">
            <div class="paint-setting">
                <div class="paint-setting__title mb-2">
                    系统主题
                </div>
                <Grid :gap="4">
                    <GridItem :colSpan="8">
                        <div @click="() => handleClick('dark', false)" class="paint-setting__system bg-[#f7f8fa]"
                            :class="{ 'paint-setting__system--active': themeStore.isDark === false }">
                            <MyIcon color="#000" name="LucideSunMedium" />
                        </div>
                    </GridItem>
                    <GridItem :colSpan="8">
                        <div @click="() => handleClick('dark', true)" class="paint-setting__system bg-[#101d37]"
                            :class="{ 'paint-setting__system--active': themeStore.isDark === true }">
                            <MyIcon color="#FFF" name="Moon" />
                        </div>
                    </GridItem>
                    <GridItem :colSpan="8">
                        <div @click="() => handleClick('dark', 'window')" class="paint-setting__system bg-[#f7f8fa]"
                            :class="{ 'paint-setting__system--active': themeStore.isDark === 'window' }">
                            <MyIcon color="#000" name="Chrome" />
                        </div>
                    </GridItem>
                </Grid>

                <div class="paint-setting__title mt-8 mb-2">
                    布局设置
                </div>
                <Grid :gap="{ x: 4, y: 4 }">
                    <GridItem :colSpan="8">
                        <div @click="() => handleClick('layout', '1')"
                            class="paint-setting__system flex-col shadow-sm bg-[#f7f8fa]"
                            :class="{ 'paint-setting__system--active': themeStore.layout === '1' }">
                            <div class="h-[20px] w-full bg-white"></div>
                            <div class="w-full">
                                <div class="h-[60px] bg-[#101d37] w-[20px]"></div>
                            </div>
                        </div>
                    </GridItem>
                    <GridItem :colSpan="8">
                        <div @click="() => handleClick('layout', '2')" class="paint-setting__system shadow-sm bg-[#f7f8fa]"
                            :class="{ 'paint-setting__system--active': themeStore.layout === '2' }">
                            <div class="h-full bg-[#101d37] w-[20px]"></div>
                            <div class="h-full flex-1">
                                <div class="h-[20px] bg-white"></div>
                            </div>
                        </div>
                    </GridItem>
                    <GridItem :colSpan="8">
                        <div @click="() => handleClick('layout', '3')"
                            class="paint-setting__system flex-col shadow-sm bg-[#f7f8fa]"
                            :class="{ 'paint-setting__system--active': themeStore.layout === '3' }">
                            <div class="h-[16px] w-full bg-[#101d37]"></div>
                            <div class="h-[64px] w-full bg-white"></div>
                        </div>
                    </GridItem>
                    <GridItem :colSpan="8">
                        <div @click="() => handleClick('layout', '4')" class="paint-setting__system shadow-sm bg-[#f7f8fa]"
                            :class="{ 'paint-setting__system--active': themeStore.layout === '4' }">
                            <div class="flex h-full w-full">
                                <div class="flex h-full">
                                    <div class="h-full w-[10px] bg-[#101d37]"></div>
                                    <div class="h-full w-[10px] bg-[#1a2744]"></div>
                                </div>
                                <div class="h-full flex-1">
                                    <div class="h-[20px] bg-white"></div>
                                </div>
                            </div>
                        </div>
                    </GridItem>
                    <GridItem :colSpan="8">
                        <div @click="() => handleClick('layout', '5')"
                            class="paint-setting__system flex-col shadow-sm bg-[#f7f8fa]"
                            :class="{ 'paint-setting__system--active': themeStore.layout === '5' }">
                            <div class="h-[16px] w-full bg-[#101d37]"></div>
                            <div class="flex h-[64px] w-full">
                                <div class="h-full w-[16px] bg-[#1a2744]"></div>
                                <div class="h-full flex-1 bg-white"></div>
                            </div>
                        </div>
                    </GridItem>
                </Grid>

                <div class="paint-setting__title mt-8 mb-2">
                    皮肤配置
                </div>
                <button type="button" class="skin-config-entry" @click="skinModalVisible = true">
                    <div class="skin-config-entry__main">
                        <MyIcon :size="18" name="LucidePaintBucket" />
                        <div class="skin-config-entry__text">
                            <span class="skin-config-entry__title">打开主题配置</span>
                            <span class="skin-config-entry__desc">当前风格：{{ currentSkinName }}</span>
                        </div>
                    </div>
                    <div class="skin-config-entry__dots">
                        <span :style="{ background: themeStore.brandColor }" />
                        <span :style="{ background: themeStore.successColor }" />
                        <span :style="{ background: themeStore.warningColor }" />
                        <span :style="{ background: themeStore.errorColor }" />
                    </div>
                </button>

                <div class="paint-setting__title mt-8 mb-2">
                    菜单主题
                </div>
                <Grid :gap="4">
                    <GridItem :colSpan="8">
                        <div @click="() => handleClick('menu', 'light')" class="paint-setting__system bg-[#f7f8fa]"
                            :class="{ 'paint-setting__system--active': themeStore.menuTheme === 'light' }">
                            <MyIcon color="#000" name="LucideSunMedium" />
                        </div>
                    </GridItem>
                    <GridItem :colSpan="8">
                        <div @click="() => handleClick('menu', 'dark')" class="paint-setting__system bg-[#101d37]"
                            :class="{ 'paint-setting__system--active': themeStore.menuTheme === 'dark' }">
                            <MyIcon color="#FFF" name="Moon" />
                        </div>
                    </GridItem>
                </Grid>

                <div class="paint-setting__title mt-8 mb-5">
                    其他配置
                </div>

                <div class="flex items-center justify-between">
                    <span>过渡效果</span>
                    <t-select
                        style="width: 100px;"
                        @change="(v) => themeStore.setRouterAnimation(v)"
                        :default-value="themeStore.routerAnimateion"
                        :options="ROUTER_ANIMATION_DATA"
                    />
                </div>

                <div class="my-4 flex items-center justify-between">
                    <span>标签页</span>
                    <t-switch :default-value="themeStore.showTab" @change="themeStore.setTab" />
                </div>

                <div class="my-4 flex items-center justify-between">
                    <span>折叠按钮</span>
                    <t-switch
                        :disabled="themeStore.layout === '3' || themeStore.layout === '4' || themeStore.layout === '5'"
                        :default-value="themeStore.showCollaspedButton"
                        @change="themeStore.setShowCollapsedButton"
                    />
                </div>

                <div class="my-4 flex items-center justify-between">
                    <span>手风琴效果</span>
                    <t-switch
                        :disabled="themeStore.layout === '4'"
                        :default-value="themeStore.menuAccordion"
                        @change="themeStore.setMenuAccordion"
                    />
                </div>
            </div>
        </t-drawer>

        <ThemeConfigModal v-model:visible="skinModalVisible" />

        <t-button size="large" shape="circle" @click="visible = true" variant="text">
            <template #icon>
                <MyIcon :strokeWidth="1.7" :size="18" name="LucidePaintBucket" />
            </template>
        </t-button>
    </div>
</template>

<style lang="scss">
.paint-setting {
    text-align: left;
    color: var(--td-text-color-primary);
}

.paint-setting__title {
    font-size: 14px;
    font-weight: 500;
    text-align: left;
}

.paint-setting__system {
    @apply h-[80px] flex items-center justify-center rounded cursor-pointer;

    &--active {
        @apply border-2 border-[var(--td-brand-color)];
    }
}

.skin-config-entry {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-medium);
    background: linear-gradient(135deg, var(--td-bg-color-container) 0%, var(--td-bg-color-secondarycontainer) 100%);
    cursor: pointer;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

    &:hover {
        border-color: var(--td-brand-color);
        box-shadow: var(--td-shadow-1);
        transform: translateY(-1px);
    }
}

.skin-config-entry__main {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.skin-config-entry__text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
}

.skin-config-entry__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
}

.skin-config-entry__desc {
    font-size: 12px;
    color: var(--td-text-color-secondary);
}

.skin-config-entry__dots {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;

    span {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.06);
    }
}
</style>
