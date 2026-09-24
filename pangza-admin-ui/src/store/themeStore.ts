import { setPiniaPersistedStateConfig } from "@/config/pinia.config";
import { applyThemeSkin, createSemanticColorMap } from "@/utils/core/css";
import {
    getDefaultCustomSkinConfig,
    getThemeSkinPreset,
    type CustomSkinConfig,
    type ThemeRadiusPreset,
    type ThemeSizePreset,
    type ThemeSkinType,
} from "@/utils/data/themeSkin";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

type RouterAnimationType = 'fade' | 'translate' | 'zoom' | 'flip' | 'rotate';

type LayoutType = '1' | '2' | '3' | '4' | '5';

type DarkModeSetting = boolean | 'window';

const defaultCustomSkin = getDefaultCustomSkinConfig();

let systemThemeMedia: MediaQueryList | null = null;

/**
 * 解析当前是否处于深色模式
 */
function resolveIsDarkMode(value: DarkModeSetting) {
    if (value === 'window') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return !!value;
}

const useThemeStore = defineStore('theme', () => {

    const isDark = ref<DarkModeSetting>(false);

    const layout = ref<LayoutType>('1');

    const skin = ref<ThemeSkinType>('tdesign');

    const customSkin = ref<CustomSkinConfig>(defaultCustomSkin);

    const radiusPreset = ref<ThemeRadiusPreset>('small');

    const sizePreset = ref<ThemeSizePreset>('default');

    const brandColor = ref(defaultCustomSkin.colors.brand);

    const successColor = ref(defaultCustomSkin.colors.success);

    const warningColor = ref(defaultCustomSkin.colors.warning);

    const errorColor = ref(defaultCustomSkin.colors.error);

    const isCollapsed = ref(false);

    const menuTheme = ref<'light' | 'dark'>('light');

    /** 当前实际是否为深色模式 */
    const isDarkMode = computed(() => resolveIsDarkMode(isDark.value));

    const theme = computed(() => isDarkMode.value ? 'dark' : 'light');

    const routerAnimateion = ref<RouterAnimationType>('translate');

    const showTab = ref(true);

    const showCollaspedButton = ref(true);

    /** 菜单手风琴效果，开启后同级子菜单仅展开一项 */
    const menuAccordion = ref(false);

    const enableShadow = ref(true);

    const enableBorder = ref(true);

    function syncColorsFromCustomSkin() {
        brandColor.value = customSkin.value.colors.brand;
        successColor.value = customSkin.value.colors.success;
        warningColor.value = customSkin.value.colors.warning;
        errorColor.value = customSkin.value.colors.error;
    }

    function getCurrentSkinColors() {
        if (skin.value === 'custom') {
            return { ...customSkin.value.colors };
        }

        return {
            brand: brandColor.value,
            success: successColor.value,
            warning: warningColor.value,
            error: errorColor.value,
        };
    }

    function applyCurrentSkin() {
        applyThemeSkin(skin.value, getCurrentSkinColors(), theme.value, {
            customSkin: skin.value === 'custom' ? customSkin.value : undefined,
            radiusPreset: radiusPreset.value,
            sizePreset: sizePreset.value,
            enableShadow: enableShadow.value,
            enableBorder: enableBorder.value,
        });
    }

    function applyResolvedTheme() {
        document.documentElement.setAttribute('theme-mode', isDarkMode.value ? 'dark' : 'light');
        applyCurrentSkin();
    }

    function handleSystemThemeChange() {
        if (isDark.value !== 'window') {
            return;
        }
        applyResolvedTheme();
    }

    function setupSystemThemeListener() {
        if (systemThemeMedia) {
            systemThemeMedia.removeEventListener('change', handleSystemThemeChange);
            systemThemeMedia = null;
        }

        if (isDark.value !== 'window') {
            return;
        }

        systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        systemThemeMedia.addEventListener('change', handleSystemThemeChange);
    }

    function setDark(state: DarkModeSetting) {
        isDark.value = state;
        applyResolvedTheme();
        setupSystemThemeListener();
    }

    function setLayout(state: LayoutType) {
        layout.value = state;
    }

    function setSkin(state: ThemeSkinType) {
        skin.value = state;
        if (state !== 'custom') {
            const preset = getThemeSkinPreset(state);
            if (preset) {
                brandColor.value = preset.brand;
                successColor.value = preset.success;
                warningColor.value = preset.warning;
                errorColor.value = preset.error;
            }
        } else {
            syncColorsFromCustomSkin();
        }
        applyCurrentSkin();
    }

    function setCustomSkin(config: CustomSkinConfig) {
        skin.value = 'custom';
        customSkin.value = config;
        syncColorsFromCustomSkin();
        applyCurrentSkin();
    }

    function updateCustomSkin(partial: Partial<CustomSkinConfig>) {
        skin.value = 'custom';
        customSkin.value = {
            ...customSkin.value,
            ...partial,
            colors: {
                ...customSkin.value.colors,
                ...partial.colors,
            },
            surface: {
                light: {
                    ...customSkin.value.surface.light,
                    ...partial.surface?.light,
                },
                dark: {
                    ...customSkin.value.surface.dark,
                    ...partial.surface?.dark,
                },
            },
            componentBorder: {
                ...customSkin.value.componentBorder,
                ...partial.componentBorder,
            },
        };
        syncColorsFromCustomSkin();
        applyCurrentSkin();
    }

    function setBrandColor(color: string) {
        updateCustomSkin({ colors: { ...customSkin.value.colors, brand: color } });
    }

    function setSuccessColor(color: string) {
        updateCustomSkin({ colors: { ...customSkin.value.colors, success: color } });
    }

    function setWarningColor(color: string) {
        updateCustomSkin({ colors: { ...customSkin.value.colors, warning: color } });
    }

    function setErrorColor(color: string) {
        updateCustomSkin({ colors: { ...customSkin.value.colors, error: color } });
    }

    function setRadiusPreset(state: ThemeRadiusPreset) {
        radiusPreset.value = state;
        applyCurrentSkin();
    }

    function setSizePreset(state: ThemeSizePreset) {
        sizePreset.value = state;
        applyCurrentSkin();
    }

    function resetCustomSkin() {
        setCustomSkin(getDefaultCustomSkinConfig());
        radiusPreset.value = 'small';
        sizePreset.value = 'default';
        enableShadow.value = true;
        enableBorder.value = true;
        applyCurrentSkin();
    }

    function initTheme() {
        applyResolvedTheme();
        setupSystemThemeListener();
        setLayout(layout.value);
    }

    function getColorMap(color: string) {
        return createSemanticColorMap(color, theme.value);
    }

    function setCollapsed(state: boolean) {
        isCollapsed.value = state;
    }

    function setRouterAnimation(state: RouterAnimationType) {
        routerAnimateion.value = state;
    }

    function setTab(state: boolean) {
        showTab.value = state;
    }

    function setMenuTheme(state: 'light' | 'dark') {
        menuTheme.value = state;
    }

    function setShowCollapsedButton(state: boolean) {
        showCollaspedButton.value = state;
    }

    function setMenuAccordion(state: boolean) {
        menuAccordion.value = state;
    }

    function setEnableShadow(state: boolean) {
        enableShadow.value = state;
        applyCurrentSkin();
    }

    function setEnableBorder(state: boolean) {
        enableBorder.value = state;
        applyCurrentSkin();
    }

    return {
        isDark,
        isDarkMode,
        theme,
        layout,
        skin,
        customSkin,
        radiusPreset,
        sizePreset,
        brandColor,
        successColor,
        warningColor,
        errorColor,
        isCollapsed,
        routerAnimateion,
        showTab,
        menuTheme,
        showCollaspedButton,
        menuAccordion,
        enableShadow,
        enableBorder,
        setDark,
        setLayout,
        setSkin,
        setCustomSkin,
        updateCustomSkin,
        setBrandColor,
        setSuccessColor,
        setWarningColor,
        setErrorColor,
        setRadiusPreset,
        setSizePreset,
        resetCustomSkin,
        initTheme,
        setCollapsed,
        setRouterAnimation,
        setTab,
        setMenuTheme,
        setShowCollapsedButton,
        setMenuAccordion,
        setEnableShadow,
        setEnableBorder,
        getColorMap,
    }

}, {
    persist: setPiniaPersistedStateConfig('themeStore')
});

export default useThemeStore;
