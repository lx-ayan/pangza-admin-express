import type { MenuResult } from "@/types/api/menu";

export const userList: LoginResult[] = [
    {
        username: 'admin',
        avatar: 'https://images.unsplash.com/photo-1602024290243-cb6c7609dd6b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=100&w=40',
        permission: ['ROLE_admin', 'ROLE_user'],
        nickName: 'Nick Brown',
        token: JSON.stringify(['ROLE_admin', 'ROLE_user'])
    },
    {
        username: 'user',
        avatar: 'https://images.unsplash.com/photo-1646380913356-8d852678bb13?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=100&w=40',
        permission: ['ROLE_user'],
        nickName: 'Tom Hardy',
        token: JSON.stringify(['ROLE_user'])
    }
];

export const menuList: MenuResult[] = [

    {
        path: '/home',
        name: 'home',
        meta: {
            auth: true,
            title: '仪表盘',
            icon: 'Home'
        },
    },
    {
        path: '/templates',
        name: 'templates',
        meta: {
            title: '组件模板',
            icon: 'Component'
        },
        children: [
            {
                path: '/templates/table',
                name: 'templates.table',
                meta: {
                    title: '高级表格'
                }
            },
            {
                path: '/templates/form',
                name: 'templates.form',
                meta: {
                    title: '高级表单'
                }
            },
            {
                path: '/templates/modalForm',
                name: 'templates.modalForm',
                meta: {
                    title: '弹窗表单'
                }
            },
            {
                path: '/templates/drawerForm',
                name: 'templates.drawerForm',
                meta: {
                    title: '抽屉表单'
                }
            },
            {
                path: '/templates/dialogButton',
                name: 'templates.dialogButton',
                meta: {
                    title: '弹窗按钮'
                }
            },
            {
                path: '/templates/circleTag',
                name: 'templates.circleTag',
                meta: {
                    title: '圆点标签'
                }
            },
            {
                path: '/templates/iconChoose',
                name: 'templates.iconChoose',
                meta: {
                    title: '图标选择器'
                }
            }
        ]
    },
    {
        path: '/pages',
        name: 'pages',
        meta: {
            icon: 'AppWindow',
            title: '页面模板'
        },
        children: [
            {
                path: '/pages/success',
                name: 'success',
                meta: {
                    title: '成功页面'
                }
            },
            {
                path: '/pages/error',
                name: 'error',
                meta: {
                    title: '错误页面'
                }
            },
            {
                path: '/pages/notfound',
                name: 'notfound',
                meta: {
                    title: '404 页面'
                }
            },
            {
                path: '/pages/notpermission',
                name: 'notpermission',
                meta: {
                    title: '403 页面'
                }
            },
            {
                path: '/pages/auth',
                name: 'auth',
                meta: {
                    title: '权限页面'
                }
            }
        ]
    },
    {
        path: '/generator',
        name: 'generator',
        meta: {
            title: '代码生成',
            icon: 'Book'
        },
        children: [
            {
                path: '/generator/table',
                name: 'generator.table',
                meta: {
                    title: '表格生成'
                }
            },
            {
                path: '/generator/form',
                name: 'generator.form',
                meta: {
                    title: '表单生成'
                }
            },
            {
                path: '/generator/json',
                name: 'generator.json',
                meta: {
                    title: 'json类型转换器'
                }
            },
            {
                path: '/generator/ts',
                name: 'generator.ts',
                meta: {
                    title: 'java 转 ts 工具'
                }
            }
        ]
    },
    {
        path: '/article',
        name: 'article',
        meta: {
            title: '公告管理',
            icon: 'File'
        },
        children: [
            {
                path: '/article/list',
                name: 'article.list',
                meta: {
                    title: '公告列表'
                }
            },
            {
                path: '/article/create',
                name: 'article.create',
                meta: {
                    title: '发布公告',
                    hidden: true
                }
            }
        ]
    },
    {
        path: '/system',
        name: 'system',
        meta: {
            auth: true,
            title: '系统管理',
            icon: 'Settings',
            permission: ['ROLE_admin']
        },
        children: [
            {
                path: '/system/user',
                name: 'system.user',
                meta: {
                    title: '用户管理',
                    auth: true,
                    permission: ['ROLE_admin']
                }
            },
            {
                path: '/system/role',
                name: 'system.role',
                meta: {
                    title: '角色管理',
                    auth: true,
                    permission: ['ROLE_admin']
                }
            },
            {
                path: '/system/menu',
                name: 'system.menu',
                meta: {
                    title: '菜单管理',
                    auth: true,
                    permission: ['ROLE_admin']
                }
            }
        ]
    }

];

export const avatarList = [
    'https://cdn.pixabay.com/photo/2019/03/17/12/57/phone-4060860_1280.jpg',
    'https://images.pexels.com/photos/34997326/pexels-photo-34997326.jpeg',
    'https://cdn.pixabay.com/photo/2024/08/30/14/02/ai-generated-9009342_1280.jpg',
    'https://cdn.pixabay.com/photo/2021/08/17/20/16/man-6554120_1280.jpg',
    'https://cdn.pixabay.com/photo/2023/05/10/05/56/groom-7983097_960_720.jpg',
    'https://cdn.pixabay.com/photo/2023/04/17/03/26/man-7931568_960_720.jpg',
    'https://cdn.pixabay.com/photo/2019/07/13/11/45/black-professional-4334648_960_720.jpg',
    'https://cdn.pixabay.com/photo/2019/12/15/10/06/groom-4696727_960_720.jpg',
    'https://cdn.pixabay.com/photo/2021/11/19/00/12/man-6807759_960_720.jpg',
    'https://cdn.pixabay.com/photo/2022/07/24/04/35/man-7340959_960_720.jpg',
    'https://cdn.pixabay.com/photo/2022/11/23/17/46/man-7612557_960_720.jpg',
    'https://cdn.pixabay.com/photo/2022/02/05/21/24/man-6995758_1280.jpg',
    'https://cdn.pixabay.com/photo/2020/11/30/17/20/businessman-5791563_960_720.jpg'
]

export const emailList = [
    'zhang_san@example.com',
    'li_mei@example.com',
    'wang_hong@example.com',
    'zhao_wei@example.com',
    'qian_bin@example.com',
    'sun_tong@example.com',
    'zhou_jie@example.com',
    'wu_hao@example.com',
    'zheng_ting@example.com',
    'feng_rui@example.com',
    'chen_lin@example.com',
    'chu_yang@example.com',
    'wei_xiang@example.com',
    'jiang_han@example.com',
    'shen_yao@example.com'
]

export const usernameList = [
    'Jason Smith',
    'Emily Jones',
    'Michael Williams',
    'Sophia Brown',
    'David Miller',
    'Olivia Davis',
    'Chris Wilson',
    'Ava Taylor',
    'Matthew Moore',
    'Isabella Anderson',
    'Ryan Thomas',
    'Mia Jackson',
    'Joshua White',
    'Luna Harris',
    'Brandon Martin'
]

export const phoneList = [
    '13812345678',
    '13987654321',
    '13511112222',
    '13633334444',
    '13755556666',
    '13077778888',
    '13199990000',
    '15022223333',
    '15144445555',
    '15266667777',
    '15388889999',
    '15500001111',
    '15622223333',
    '15744445555',
    '15866667777'
]

export const addressList = [
    '北京市朝阳区建国路88号',
    '上海市浦东新区张江高科技园区',
    '广州市天河区天河路385号',
    '深圳市南山区科技园南区',
    '杭州市西湖区文三路99号',
    '成都市锦江区春熙路步行街',
    '武汉市武昌区中南路1号',
    '西安市雁塔区长安南路2号',
    '南京市玄武区中山路18号',
    '重庆市渝中区解放碑步行街',
    '天津市和平区南京路100号',
    '长沙市岳麓区岳麓大道58号',
    '郑州市金水区花园路39号',
    '济南市历下区泉城路188号',
    '合肥市蜀山区长江西路200号'
]

export const birthdayList = [
    '1990-05-12',
    '1992-08-23',
    '1995-11-06',
    '1988-03-17',
    '1993-07-30',
    '1991-02-09',
    '1989-09-15',
    '1994-04-22',
    '1996-10-01',
    '1987-06-18',
    '1997-12-05',
    '1998-01-28',
    '2000-03-04',
    '1999-08-11',
    '1986-11-20'
]

export const roleList = [
    { id: 1, name: 'ROLE_ADMIN', nameZh: '系统管理员', description: '系统的最高权限，能看到系统所有模块', status: 1 },
    { id: 2, name: 'ROLE_CHAIRMAN', nameZh: '董事长', description: '能看到所有系统业务权限', status: 0 },
    { id: 3, name: 'ROLE_MANAGER', nameZh: '项目经理', description: '项目经理的权限描述', status: 1 },
    { id: 4, name: 'ROLE_FRONT', nameZh: '前端开发工程师', description: '前端开发工程师的权限描述', status: 1 },
    { id: 5, name: 'ROLE_SERVER', nameZh: '后端开发工程师', description: '后端开发工程师的权限描述', status: 1 },
    { id: 6, name: 'ROLE_TEST', nameZh: '测试工程师', description: '测试工程师的权限描述', status: 0 },
    { id: 7, name: 'ROLE_UI', nameZh: 'UI 设计师', description: 'UI 设计师的权限描述', status: 0 },
    { id: 8, name: 'ROLE_HR', nameZh: '人事', description: '人事的权限描述', status: 1 },
    { id: 9, name: 'ROLE_FINANCE', nameZh: '财务', description: '财务的权限描述', status: 1 },
    { id: 10, name: 'ROLE_SALE', nameZh: '销售', description: '销售的权限描述', status: 1 },
]