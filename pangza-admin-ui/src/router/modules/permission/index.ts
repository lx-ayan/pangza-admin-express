import type { RouteRecordRaw } from "vue-router";

export default {
    path: '/permission',
    children: [
        {
            path: '/permission/notpermission',
            name: 'notpermission',
            component: () => import('@/views/permission/notpermission/index.vue')
        },
        {
            path: '/permission/notfound',
            name: 'notfound',
            component: () => import('@/views/permission/notfound/index.vue')
        }
    ]
} as RouteRecordRaw