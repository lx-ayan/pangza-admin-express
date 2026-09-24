import useMenuNavigate from '@/hooks/components/useMenuNavigate';
import useUserStore from '@/store/userStore';
import type { MenuResult } from '@/types/api/menu';
import { computed, inject, provide, ref, watch, type InjectionKey } from 'vue';
import { useRoute } from 'vue-router';

interface HybridMenuContext {
    activeParentPath: ReturnType<typeof ref<string>>;
    menuList: ReturnType<typeof computed<MenuResult[]>>;
    activeChildren: ReturnType<typeof computed<MenuResult[]>>;
    hasChildPanel: ReturnType<typeof computed<boolean>>;
    handleTopMenuClick: (menu: MenuResult) => void;
}

const HYBRID_MENU_KEY: InjectionKey<HybridMenuContext> = Symbol('hybridMenu');

/**
 * 混合布局菜单状态：顶部一级 + 左侧二级
 */
export function provideHybridMenu() {
    const route = useRoute();
    const userStore = useUserStore();
    const { handleMenuClick, findActiveParentPath, getVisibleChildren } = useMenuNavigate();

    const activeParentPath = ref('');

    const menuList = computed(() => getVisibleChildren(userStore.menuList));

    const activeParent = computed(() => {
        return menuList.value.find((menu) => menu.path === activeParentPath.value);
    });

    const activeChildren = computed(() => getVisibleChildren(activeParent.value?.children));

    const hasChildPanel = computed(() => activeChildren.value.length > 0);

    watch(
        () => [route.fullPath, menuList.value] as const,
        () => {
            activeParentPath.value = findActiveParentPath(menuList.value, route.fullPath);
        },
        { immediate: true },
    );

    function handleTopMenuClick(menu: MenuResult) {
        activeParentPath.value = menu.path;
        if (!getVisibleChildren(menu.children).length) {
            handleMenuClick(menu);
        }
    }

    const context: HybridMenuContext = {
        activeParentPath,
        menuList,
        activeChildren,
        hasChildPanel,
        handleTopMenuClick,
    };

    provide(HYBRID_MENU_KEY, context);
    return context;
}

export function useHybridMenu() {
    const context = inject(HYBRID_MENU_KEY);
    if (!context) {
        throw new Error('useHybridMenu must be used within a layout that provides hybrid menu context');
    }
    return context;
}
