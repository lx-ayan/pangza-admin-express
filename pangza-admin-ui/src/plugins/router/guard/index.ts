import useUserStore from "@/store/userStore";
import StringUtil from "@/utils/clz/StringUtil";
import { hasPermission } from "@/utils/security";
import type { RouteLocationNormalized, Router, RouteRecordRaw } from "vue-router";
import { addRoute, getServerRouteList } from "../autoload/server";
import { autoloadByModules } from "../autoload/module";
import { autoloadByViews } from "../autoload/views";
import type { MenuResult } from "@/types/api/menu";

class RouterGuard {

    private autoloadFinish = false;

    private routes: RouteRecordRaw[] = [];

    constructor(private router: Router) {

    }

    public run() {
        this.router!.beforeEach(this.beforeEach.bind(this));
    }

    async beforeEach(to: RouteLocationNormalized, from: RouteLocationNormalized) {
        const userStore = useUserStore();
        console.log('to =', to);
        await this.autoLoad(userStore.token, userStore.menuList || []);

        if (to.path === '/login') {
            if (userStore.token) return from;
            this.resetRouters();
            this.autoloadFinish = false;
        }

        const isLoginResult = this.isLogin(to, userStore.token);
        if (!isLoginResult) {
            return { name: 'login' };
        }

        const checkPermission = this.checkPermission(to);
        if (!checkPermission) {
            return { name: 'notpermission' }
        }
    }

    private async autoLoad(token: string, menuList: MenuResult[]) {
        const mode = import.meta.env.VITE_LOAD_ROUTER;
        if (!this.autoloadFinish && token) {
            if (mode === 'server') {
                const userRouters = menuList;
                this.routes = getServerRouteList(userRouters);
            } else {
                this.routes = (mode === 'module' ? autoloadByModules : autoloadByViews)();
            }

            if (this.routes.length) {
                this.routes.forEach(route => {
                    addRoute(this.router, route);
                })
                this.autoloadFinish = true;
            }
        }
    }

    private isLogin(route: RouteLocationNormalized, token: string) {
        if (!route.meta.auth) {
            return true;
        } else {
            return !StringUtil.isEmpty(token);
        }
    }

    private checkPermission(route: RouteLocationNormalized) {
        if (!route.meta) {
            return true;
        }
        const permission = route.meta.permission;
        if (!permission || (permission && !permission.length)) return true;

        return hasPermission(permission);
    }

    private resetRouters() {
        this.routes.forEach(route => {
            const { name } = route;
            if (name && this.router?.hasRoute(name)) {
                this.router?.removeRoute(name);
            }
        })
        this.autoloadFinish = false;
    }
}

export default (router: Router) => {
    new RouterGuard(router).run();
}