<script setup lang='ts'>
import useUserStore from '@/store/userStore';
import { ref } from 'vue';
const userStore = useUserStore();

interface User {
    username: string;
    role: string;
    roleLabel: string;
    description: string;
}

const currentUser = ref<User>({
    username: userStore.userInfo.username || '',
    role: userStore.permission[0],
    roleLabel: '管理员',
    description: '拥有管理员权限，可以管理用户和部分系统设置'
});

const users = ref<User[]>([
    {
        username: 'admin',
        role: 'ROLE_admin',
        roleLabel: '管理员',
        description: '拥有管理员权限，可以管理用户和部分系统设置'
    },
    {
        username: 'user',
        role: 'ROLE_user',
        roleLabel: '普通用户',
        description: '普通用户权限，只能访问基础功能模块'
    }
]);

const switchUser = (user: User) => {
    currentUser.value = { ...user };
    userStore.login({
        username: user.username,
        password: '123456'
    })
};

</script>
<template>
    <div class="p-6">
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">权限切换演示</h1>
            <p class="text-gray-500 dark:text-gray-300">
                点击下方按钮切换不同用户身份，模拟不同用户登录系统的效果。切换后会影响整个系统的菜单显示和按钮权限。
            </p>
        </div>

        <t-card title="当前登录用户" class="mb-6" :bordered="true">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <span class="text-gray-500 dark:text-gray-300">用户名：</span>
                    <span class="font-medium">{{ currentUser.username }}</span>
                </div>
                <div>
                    <span class="text-gray-500 dark:text-gray-300">角色：</span>
                    <t-tag
                        :theme="currentUser.role === 'R_SUPER' ? 'success' : currentUser.role === 'R_ADMIN' ? 'warning' : 'default'">
                        {{ currentUser.roleLabel }}
                    </t-tag>
                </div>

            </div>
        </t-card>

        <t-card title="账号切换" class="mb-6" :bordered="true">
            <t-space :size="24" wrap>
                <t-card v-for="(user) in users" :key="user.role" :class="{
                    'border-2 border-blue-500': currentUser.role === user.role,
                    'bg-green-50 dark:bg-green-900/20': user.role === 'R_SUPER',
                    'bg-amber-50 dark:bg-amber-900/20': user.role === 'R_ADMIN',
                    'bg-blue-50 dark:bg-blue-900/20': user.role === 'R_USER'
                }" style="width: 350px" :bordered="true">
                    <template #title>
                        <div class="font-semibold">{{ user.roleLabel }}</div>
                    </template>
                    <div class="mb-4">
                        <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">{{ user.description }}</p>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                            <div>用户名: {{ user.username }}</div>
                            <div>角色: {{ user.role }}</div>
                        </div>
                    </div>
                    <t-button :theme="currentUser.role === user.role ? 'primary' : 'default'" @click="switchUser(user)"
                        block>
                        {{ currentUser.role === user.role ? '当前用户' : '切换到该角色' }}
                    </t-button>
                </t-card>
                <Auth :permission="['ROLE_admin']">

                    <t-card style="width: 350px" title="admin 能看到" :bordered="true">
                        <div class="mb-4">
                            <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">使用 Auth 组件进行权限控制</p>
                            <div class="text-xs text-gray-500 dark:text-gray-400">
                                <div>您也可以使用 v-permission 来权限控制</div>
                                <div>当前用户：admin</div>
                            </div>
                        </div>
                    </t-card>
                </Auth>
            </t-space>
        </t-card>

        <t-card title="权限控制">
            <div>

                <t-typography-paragraph>
                    您可以使用 <t-typography-text code>v-permission</t-typography-text> 指令来实现您的权限控制。v-permission
                    不仅可以传入字符串也可以传入字符串数组。
                </t-typography-paragraph>

                <Grid class="mt-3" :cols="3" :gap="6">
                    <GridItem>
                        <t-button v-permission="'ROLE_super'" block>超级管理员可见（假设有）</t-button>
                    </GridItem>

                    <GridItem>
                        <t-button v-permission="'ROLE_admin'" block>管理员可见</t-button>
                    </GridItem>

                    <GridItem>
                        <t-button v-permission="['ROLE_admin', 'ROLE_user']" block>普通用户可见</t-button>
                    </GridItem>
                </Grid>
            </div>

            <div class="mt-10">
                <t-typography-paragraph>
                    您也可以使用 Auth 组件进行权限控制。permission 字段可以传入字符串也可以传入字符串数组。
                </t-typography-paragraph>

                <Grid class="mt-3" :cols="3" :gap="6">
                    <GridItem>
                        <Auth :permission="'ROLE_super'">
                            <t-button block>超级管理员可见（假设有）</t-button>
                        </Auth>
                    </GridItem>

                    <GridItem>
                        <Auth :permission="'ROLE_admin'">
                            <t-button v-permission="'ROLE_admin'" block>管理员可见</t-button>
                        </Auth>
                    </GridItem>

                    <GridItem>
                        <Auth :permission="['ROLE_admin', 'ROLE_user']">
                            <t-button block>普通用户可见</t-button>
                        </Auth>
                    </GridItem>
                </Grid>
            </div>
        </t-card>
    </div>
</template>