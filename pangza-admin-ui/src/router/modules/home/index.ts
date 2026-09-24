export default {
    path: '/home',
    children: [
        {
            path: '/home',
            meta: {
                auth: true,
            },
            component: () => import('@/views/home/index.vue')
        }
    ]
}