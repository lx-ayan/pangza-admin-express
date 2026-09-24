import useThemeStore from "@/store/themeStore";
import { computed } from "vue";

function useColor() {
    const themeStore = useThemeStore();

    /** 主体区域背景，跟随皮肤中性色 */
    const layoutBackgroundColor = computed(() => 'var(--td-bg-color-page)');

    /** 次级容器背景，如 GrayCard */
    const cardBackgroundColor = computed(() => 'var(--td-bg-color-secondarycontainer)');

    const borderColor = computed(() => 'var(--td-component-border)');

    const textColor = computed(() => 'var(--td-text-color-secondary)');

    const cardBgColor = computed(() => 'var(--td-bg-color-container)');

    function initTheme() {
        themeStore.initTheme();
    }

    return {
        layoutBackgroundColor,
        cardBackgroundColor,
        borderColor,
        textColor,
        cardBgColor,
        initTheme,
    };
}

export default useColor;
