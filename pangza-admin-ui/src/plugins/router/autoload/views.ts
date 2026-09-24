import type { RouteRecordRaw } from "vue-router";

const layoutsList = import.meta.glob('../../../views/**/index.vue', { eager: true });
const viewList = import.meta.glob('../../../views/*/**/index.vue', { eager: true });

const regex = /components/;
const nameREG = /.+layouts\/|.+views\/|\/index.vue/gi;

export function autoloadByViews() {
    const routeList: RouteRecordRaw[] = [];
    Object.entries(layoutsList).forEach(([file, module]: any) => {
        const route = getRouteByModule(file, module);
        if (route) {
            route.children = getChildrenRoutes(route);
            if (route.children && route.children.length > 0) {
                route.redirect = route.children[0].path;
            }
            if (!regex.test(route.path)) {
                routeList.push(route);
            }
        }
    });
    return routeList;
}

function getChildrenRoutes(layoutRoute: RouteRecordRaw) {
    const { name } = layoutRoute;
    const routes: RouteRecordRaw[] = [];

    Object.entries(viewList).forEach(([file, module]) => {
        if (file.includes(`../../../views/${name as string}`) && !file.includes(`../../../views/${name as string}/index.vue`)) {
            if (!regex.test(file)) {
                const route = getRouteByModule(file, module as any);
                if (route) {
                    routes.push({
                        ...route,
                    });
                }
            }
        }
    });
    return routes;
}

function getRouteByModule(file: string, module: { [key: string]: any }) {
    if (module.default?.router && module.default?.router.notAdd) {
        return null;
    }
    const name = file.replace(nameREG, '');
    const route: RouteRecordRaw = {
        path: `/${name}`.toLocaleLowerCase(),
        //@ts-ignore
        name: name.replaceAll('/', '.'),
        meta: {
            //@ts-ignore
            title: name.replaceAll('/', '.'),
        },
        component: module.default
    };
    return Object.assign(route, module.default?.router);
}