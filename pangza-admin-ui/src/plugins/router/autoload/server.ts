import type { MenuResult } from "@/types/api/menu";
import { APP_ROUTE_NAME } from "@/utils/data/constant";
import type { RouteRecordRaw, Router } from "vue-router";

const modules = import.meta.glob('../../../views/**/*.vue');
//@ts-ignore
function formatRoute(routeList: Array<MenuResult>, children = false): RouteRecordRaw[] {
    const formatRouteList: Array<RouteRecordRaw> = [];
    if (!routeList) return [];
    routeList.forEach(route => {
        const { path, name, meta } = route;
        const currentRoute: any = {};
        currentRoute.path = path;
        currentRoute.name = name;
        currentRoute.meta = meta;
        // currentRoute.component = module[`../../../views${path}/index.vue`];
        const modulePath = `../../../views${path}/index.vue`;
        currentRoute.component = modules[modulePath];
        if (route.children && route.children.length) {
            currentRoute.children = formatRoute(route.children, true);
        }
        formatRouteList.push(currentRoute);
    })

    return formatRouteList;
}

export function getServerRouteList(routeList: Array<MenuResult>) {
    const formatRouteList = formatRoute(routeList);
    return formatRouteList;
}

export function addRoute(router: Router, route: RouteRecordRaw, name: string = APP_ROUTE_NAME) {
    router.addRoute(name, route);
}