import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import useThemeStore from '@/store/themeStore';

/**
 * 图表主题：默认跟随系统主题色 / 深浅色
 */
export function useChartTheme(customColor?: MaybeRefOrGetter<string | undefined>) {
    const themeStore = useThemeStore();

    /** 实际使用的主色 */
    const brandColor = computed(() => toValue(customColor) || themeStore.brandColor);

    /** 是否深色模式 */
    const isDark = computed(() => themeStore.isDarkMode);

    return {
        themeStore,
        brandColor,
        isDark,
    };
}
