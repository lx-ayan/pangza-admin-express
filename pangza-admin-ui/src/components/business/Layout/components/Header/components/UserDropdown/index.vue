<script setup lang='ts'>
import useUserStore from '@/store/userStore';
import { DialogPlugin, type DropdownOption } from 'tdesign-vue-next';
import { useRouter } from 'vue-router';

const userStore = useUserStore();

const router = useRouter();

/**
 * 下拉菜单点击：个人中心 / 退出登录
 */
function handleClick({ value }: DropdownOption) {
    if (value === 1) {
        router.push('/profile');
        return;
    }
    if (value === 2) {
        const dialog = DialogPlugin.confirm({
            header: '系统提示',
            body: '确认退出登录吗？',
            onConfirm: () => {
                userStore.logout().finally(() => {
                    dialog.destroy();
                });
            },
        });
    }
}

</script>
<template>
    <t-dropdown @click="handleClick" trigger="click" placement="bottom"
        :options="[{ content: '个人中心', value: 1 }, { content: '退出登录', value: 2 }]">
        <div class="flex items-center cursor-pointer">
            <img class="h-8 w-8 rounded-full mr-2" :src="userStore.userInfo?.avatar" alt="">
            <span class=" text-sm">
                {{ userStore.userInfo?.nickName || userStore.userInfo?.username }}
            </span>
        </div>
    </t-dropdown>
</template>
