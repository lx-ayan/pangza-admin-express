import { APP_ROUTE_NAME } from "@/utils/data/constant";
import { createRouter, createWebHashHistory } from "vue-router";
const router = createRouter({
    routes: [
        {
            path: '/',
            name: APP_ROUTE_NAME,
            redirect: '/home',
            component: () => import('@/views/main.vue'),
            meta: {
                auth: true
            },
            children: [
                {
                    path: '/profile',
                    component: () => import('@/views/profile/index.vue'),
                    meta: {
                        auth: true,
                        title: '个人中心'
                    }
                },
                {
                    path: '/:pathMatch(.*)',
                    component: () => import('@/views/pages/notfound/index.vue'),
                    meta: {},
                    beforeEnter: (to) => {
                        const toRoute = router.getRoutes()
                            .find((item) => to.path.toLowerCase() == item.path.toLowerCase());
                        if (toRoute) {
                            return to;
                        }
                    }
                },
                {
                    path: '/pages',
                    children: [
                        {
                            path: '/pages/notpermission',
                            name: 'notpermission',
                            component: () => import('@/views/pages/notpermission/index.vue')
                        },
                        {
                            path: '/pages/notfound',
                            name: 'notfound',
                            component: () => import('@/views/pages/notfound/index.vue')
                        }
                    ]
                }
            ]
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/login/index.vue')
        }
    ],
    history: createWebHashHistory()
});
export default router;