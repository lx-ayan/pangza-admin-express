<script setup lang="ts">
import useThemeStore from '@/store/themeStore';
import { rgb2Hex } from '@/utils/core/css';
import {
    THEME_RADIUS_OPTIONS,
    THEME_SIZE_OPTIONS,
    THEME_SKIN_PRESETS,
    type CustomSkinConfig,
    type ThemeRadiusPreset,
    type ThemeSizePreset,
    type ThemeSkinType,
} from '@/utils/data/themeSkin';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const emit = defineEmits<{
    close: [];
}>();

const themeStore = useThemeStore();

const neutralPreset = ref<ThemeSkinType>('tdesign');

const STYLE_OPTIONS = [
    ...THEME_SKIN_PRESETS.map((item) => ({ label: item.name, value: item.id })),
    { label: 'Custom', value: 'custom' as const },
];

const NEUTRAL_OPTIONS = THEME_SKIN_PRESETS.map((item) => ({
    label: item.name,
    value: item.id,
}));

const LIGHT_SURFACE_FIELDS = [
    { key: 'page', label: '页面背景' },
    { key: 'secondaryContainer', label: '次级背景' },
    { key: 'container', label: '容器背景' },
] as const;

const DARK_SURFACE_FIELDS = [...LIGHT_SURFACE_FIELDS] as const;

function handleStyleChange(value: ThemeSkinType) {
    themeStore.setSkin(value);
}

function handleNeutralChange(value: ThemeSkinType) {
    neutralPreset.value = value;
    const preset = THEME_SKIN_PRESETS.find((item) => item.id === value);
    if (!preset) {
        return;
    }
    themeStore.updateCustomSkin({
        surface: {
            light: { ...preset.surface.light },
            dark: { ...preset.surface.dark },
        },
        componentBorder: { ...preset.componentBorder },
    });
}

function updateLightSurface(key: keyof CustomSkinConfig['surface']['light'], value: string) {
    themeStore.updateCustomSkin({
        surface: {
            ...themeStore.customSkin.surface,
            light: {
                ...themeStore.customSkin.surface.light,
                [key]: rgb2Hex(value),
            },
        },
    });
}

function updateDarkSurface(key: keyof CustomSkinConfig['surface']['dark'], value: string) {
    themeStore.updateCustomSkin({
        surface: {
            ...themeStore.customSkin.surface,
            dark: {
                ...themeStore.customSkin.surface.dark,
                [key]: rgb2Hex(value),
            },
        },
    });
}

function updateBorder(mode: 'light' | 'dark', value: string) {
    themeStore.updateCustomSkin({
        componentBorder: {
            ...themeStore.customSkin.componentBorder,
            [mode]: rgb2Hex(value),
        },
    });
}

function copyConfig() {
    const config = {
        skin: themeStore.skin,
        radiusPreset: themeStore.radiusPreset,
        sizePreset: themeStore.sizePreset,
        customSkin: themeStore.customSkin,
        enableShadow: themeStore.enableShadow,
        enableBorder: themeStore.enableBorder,
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    MessagePlugin.success('配置已复制到剪贴板');
}

function randomizeTheme() {
    const randomHex = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
    themeStore.updateCustomSkin({
        colors: {
            brand: randomHex(),
            success: randomHex(),
            warning: randomHex(),
            error: randomHex(),
        },
    });
    MessagePlugin.success('已随机生成配色');
}
</script>

<template>
    <div class="theme-config-panel">
        <div class="theme-config-panel__header">
            <span>主题配置</span>
            <button class="theme-config-panel__close" type="button" @click="emit('close')">
                <MyIcon :size="16" name="X" />
            </button>
        </div>

        <div class="theme-config-panel__body">
            <div class="theme-config-panel__group">
                <div class="theme-config-panel__group-title">主配置</div>

                <div class="theme-config-panel__field">
                    <span class="theme-config-panel__label">风格</span>
                    <t-select
                        :value="themeStore.skin"
                        :options="STYLE_OPTIONS"
                        size="small"
                        @change="handleStyleChange"
                    />
                </div>

                <div class="theme-config-panel__field">
                    <span class="theme-config-panel__label">圆角</span>
                    <div class="theme-config-panel__field-control">
                        <t-select
                            :value="themeStore.radiusPreset"
                            :options="THEME_RADIUS_OPTIONS.map((item) => ({ label: item.label, value: item.value }))"
                            size="small"
                            @change="(value) => themeStore.setRadiusPreset(value)"
                        />
                        <span class="theme-config-panel__radius-icon" :data-radius="themeStore.radiusPreset" />
                    </div>
                </div>

                <div class="theme-config-panel__field">
                    <span class="theme-config-panel__label">全局大小</span>
                    <t-select
                        :value="themeStore.sizePreset"
                        :options="THEME_SIZE_OPTIONS.map((item) => ({ label: item.label, value: item.value }))"
                        size="small"
                        @change="(value) => themeStore.setSizePreset(value)"
                    />
                </div>
            </div>

            <div class="theme-config-panel__group">
                <div class="theme-config-panel__group-title">底色配置</div>

                <div class="theme-config-panel__field">
                    <span class="theme-config-panel__label">预设</span>
                    <t-select
                        :value="neutralPreset"
                        :options="NEUTRAL_OPTIONS"
                        size="small"
                        @change="handleNeutralChange"
                    />
                </div>

                <div class="theme-config-panel__subgroup">
                    <div class="theme-config-panel__subtitle">浅色模式</div>
                    <div
                        v-for="item in LIGHT_SURFACE_FIELDS"
                        :key="`light-${item.key}`"
                        class="theme-config-panel__field"
                    >
                        <span class="theme-config-panel__label">{{ item.label }}</span>
                        <t-color-picker
                            :value="themeStore.customSkin.surface.light[item.key]"
                            :color-modes="['monochrome']"
                            size="small"
                            @change="(value) => updateLightSurface(item.key, value)"
                        />
                    </div>
                    <div class="theme-config-panel__field">
                        <span class="theme-config-panel__label">边框颜色</span>
                        <t-color-picker
                            :value="themeStore.customSkin.componentBorder.light"
                            :color-modes="['monochrome']"
                            size="small"
                            @change="(value) => updateBorder('light', value)"
                        />
                    </div>
                </div>

                <div class="theme-config-panel__subgroup">
                    <div class="theme-config-panel__subtitle">深色模式</div>
                    <div
                        v-for="item in DARK_SURFACE_FIELDS"
                        :key="`dark-${item.key}`"
                        class="theme-config-panel__field"
                    >
                        <span class="theme-config-panel__label">{{ item.label }}</span>
                        <t-color-picker
                            :value="themeStore.customSkin.surface.dark[item.key]"
                            :color-modes="['monochrome']"
                            size="small"
                            @change="(value) => updateDarkSurface(item.key, value)"
                        />
                    </div>
                    <div class="theme-config-panel__field">
                        <span class="theme-config-panel__label">边框颜色</span>
                        <t-color-picker
                            :value="themeStore.customSkin.componentBorder.dark"
                            :color-modes="['monochrome']"
                            size="small"
                            @change="(value) => updateBorder('dark', value)"
                        />
                    </div>
                </div>
            </div>

            <div class="theme-config-panel__group">
                <div class="theme-config-panel__group-title">高级主题</div>
                <div class="theme-config-panel__toggles">
                    <button
                        type="button"
                        class="theme-config-panel__toggle"
                        :class="{ 'theme-config-panel__toggle--active': themeStore.enableBorder }"
                        @click="themeStore.setEnableBorder(!themeStore.enableBorder)"
                    >
                        边框
                    </button>
                    <button
                        type="button"
                        class="theme-config-panel__toggle"
                        :class="{ 'theme-config-panel__toggle--active': themeStore.enableShadow }"
                        @click="themeStore.setEnableShadow(!themeStore.enableShadow)"
                    >
                        阴影
                    </button>
                </div>
            </div>

            <div class="theme-config-panel__group">
                <div class="theme-config-panel__group-title">品牌色</div>
                <div class="theme-config-panel__field">
                    <span class="theme-config-panel__label">主题色</span>
                    <t-color-picker
                        :value="themeStore.brandColor"
                        :color-modes="['monochrome']"
                        size="small"
                        @change="(value) => themeStore.setBrandColor(rgb2Hex(value))"
                    />
                </div>
                <div class="theme-config-panel__field">
                    <span class="theme-config-panel__label">次级色</span>
                    <t-color-picker
                        :value="themeStore.successColor"
                        :color-modes="['monochrome']"
                        size="small"
                        @change="(value) => themeStore.setSuccessColor(rgb2Hex(value))"
                    />
                </div>
                <div class="theme-config-panel__field">
                    <span class="theme-config-panel__label">强调色</span>
                    <t-color-picker
                        :value="themeStore.warningColor"
                        :color-modes="['monochrome']"
                        size="small"
                        @change="(value) => themeStore.setWarningColor(rgb2Hex(value))"
                    />
                </div>
                <div class="theme-config-panel__field">
                    <span class="theme-config-panel__label">错误色</span>
                    <t-color-picker
                        :value="themeStore.errorColor"
                        :color-modes="['monochrome']"
                        size="small"
                        @change="(value) => themeStore.setErrorColor(rgb2Hex(value))"
                    />
                </div>
            </div>
        </div>

        <div class="theme-config-panel__footer">
            <t-button size="small" variant="outline" @click="themeStore.resetCustomSkin()">重置</t-button>
            <t-button size="small" variant="outline" @click="copyConfig">复制配置</t-button>
            <t-button size="small" variant="outline" @click="randomizeTheme">随机</t-button>
        </div>
    </div>
</template>

<style scoped lang="scss">
.theme-config-panel {
    display: flex;
    flex-direction: column;
    width: 340px;
    height: 100%;
    padding: 0 8px 0 16px;
    background: transparent;
    color: var(--td-text-color-primary);
}

.theme-config-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 4px 12px;
    font-size: 16px;
    font-weight: 600;
}

.theme-config-panel__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--td-radius-default);
    background: transparent;
    color: var(--td-text-color-secondary);
    cursor: pointer;

    &:hover {
        background: var(--td-bg-color-container-hover);
        color: var(--td-text-color-primary);
    }
}

.theme-config-panel__body {
    flex: 1;
    overflow-y: auto;
    padding: 0 4px 16px 0;
}

.theme-config-panel__group + .theme-config-panel__group {
    margin-top: 32px;
}

.theme-config-panel__group-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
}

.theme-config-panel__subgroup {
    margin-top: 12px;
    padding: 12px;
    border-radius: var(--td-radius-medium);
    background: var(--td-bg-color-secondarycontainer);
}

.theme-config-panel__subgroup + .theme-config-panel__subgroup {
    margin-top: 10px;
}

.theme-config-panel__subtitle {
    margin-bottom: 10px;
    font-size: 12px;
    color: var(--td-text-color-secondary);
}

.theme-config-panel__field {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;

    &:last-child {
        margin-bottom: 0;
    }
}

.theme-config-panel__label {
    flex-shrink: 0;
    width: 64px;
    font-size: 13px;
    color: var(--td-text-color-secondary);
}

.theme-config-panel__field-control {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-width: 0;
}

.theme-config-panel__radius-icon {
    width: 18px;
    height: 18px;
    border: 2px solid var(--td-text-color-secondary);
    border-top: none;
    border-left: none;
    flex-shrink: 0;

    &[data-radius='none'] {
        border-radius: 0;
    }

    &[data-radius='small'] {
        border-bottom-right-radius: 3px;
    }

    &[data-radius='medium'] {
        border-bottom-right-radius: 8px;
    }

    &[data-radius='large'] {
        border-bottom-right-radius: 14px;
    }
}

.theme-config-panel__toggles {
    display: flex;
    gap: 8px;
}

.theme-config-panel__toggle {
    flex: 1;
    height: 34px;
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-medium);
    background: var(--td-bg-color-container);
    color: var(--td-text-color-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: var(--td-brand-color);
        color: var(--td-text-color-primary);
    }

    &--active {
        border-color: var(--td-brand-color);
        background: var(--td-brand-color-light);
        color: var(--td-brand-color);
    }
}

.theme-config-panel__footer {
    display: flex;
    gap: 8px;
    padding: 16px 4px 18px 0;
}

.theme-config-panel__footer :deep(.t-button) {
    flex: 1;
}

.theme-config-panel :deep(.t-select),
.theme-config-panel :deep(.t-color-picker) {
    flex: 1;
    max-width: 168px;
}
</style>
