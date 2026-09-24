import useTabStore from '@/store/tabStore';
import type { MenuResult } from '@/types/api/menu';
import { useRouter } from 'vue-router';

/**
 * 判断菜单是否隐藏（兼容后端 Integer：1 隐藏 / 0 显示，以及 boolean）
 */
function isMenuHidden(menu: MenuResult) {
    const hidden = menu.meta?.hidden as unknown;
    return hidden === true || hidden === 1 || hidden === '1';
}

/**
 * 菜单点击跳转与标签页联动
 */
export default function useMenuNavigate() {
    const router = useRouter();
    const tabStore = useTabStore();

    /**
     * 处理菜单项点击
     */
    function handleMenuClick(menu: MenuResult) {
        if (menu.meta?.link) {
            if (menu.meta.href) {
                window.open(menu.meta.href);
            }
            return;
        }
        router.push({ name: menu.name });
        tabStore.addTab({
            title: menu.meta?.title || '未命名',
            url: menu.path,
            closeable: menu.path !== '/home',
        });
        tabStore.setActiveTab(menu.path);
    }

    /**
     * 判断菜单路径是否匹配当前路由
     */
    function isMenuActive(menu: MenuResult, currentPath: string): boolean {
        if (menu.path === currentPath) {
            return true;
        }
        return menu.children?.some((child) => isMenuActive(child, currentPath)) ?? false;
    }

    /**
     * 获取当前路由对应的顶级父菜单 path
     */
    function findActiveParentPath(menus: MenuResult[], currentPath: string): string {
        for (const menu of menus) {
            if (isMenuHidden(menu)) {
                continue;
            }
            if (isMenuActive(menu, currentPath)) {
                return menu.path;
            }
        }
        const firstMenu = menus.find((menu) => !isMenuHidden(menu));
        return firstMenu?.path ?? '';
    }

    /**
     * 获取可见子菜单（meta.hidden 为 1/true 时不渲染）
     */
    function getVisibleChildren(menus: MenuResult[] = []) {
        return menus.filter((menu) => !isMenuHidden(menu));
    }

    return {
        handleMenuClick,
        isMenuActive,
        findActiveParentPath,
        getVisibleChildren,
    };
}
