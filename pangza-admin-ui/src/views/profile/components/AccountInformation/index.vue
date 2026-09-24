<script setup lang='ts'>
import type { ProFormOption } from '@/components/ProComponents';
import { getProfile, updateProfile } from '@/api/user';
import useUserStore from '@/store/userStore';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const userStore = useUserStore();

const options = ref<ProFormOption[]>([
    {
        name: 'nickName',
        label: '昵称',
        gridProps: {
            colSpan: 12
        },
        placeholder: '请输入'
    },
    {
        name: 'email',
        label: '邮箱',
        gridProps: {
            colSpan: 12
        },
        placeholder: '请输入'
    },
    {
        name: 'phone',
        label: '手机号',
        gridProps: {
            colSpan: 12
        },
        placeholder: '请输入'
    },
    {
        name: 'address',
        label: '地址',
        gridProps: {
            colSpan: 12
        },
        placeholder: '请输入'
    }
]);

/**
 * 加载当前账户信息
 */
async function loadProfile() {
    const user = await getProfile();
    return {
        nickName: user.nickName,
        email: user.email,
        phone: user.phone,
        address: user.address,
    };
}

/**
 * 保存账户信息，并同步本地登录态展示字段
 */
async function handleSubmit(data: UpdateProfileDTO) {
    const user = await updateProfile({
        nickName: data.nickName,
        email: data.email,
        phone: data.phone,
        address: data.address,
    });
    const info = userStore.getUserInfo();
    if (info) {
        userStore.setUserInfo({
            ...info,
            nickName: user.nickName || info.nickName,
            avatar: user.avatar || info.avatar,
        });
    }
    MessagePlugin.success('保存成功');
}
</script>
<template>
    <t-card :bordered="false" class="mt-8 mb-4">
        <div class="text-[#16192C] dark:text-white text-base font-normal mb-5">
            账户信息
        </div>

        <div>
            <ProForm
                hideReset
                submitText="保存信息"
                :formProps="{ labelAlign: 'top' }"
                :gap="{ x: 6, y: 8 }"
                :options="options"
                :request="loadProfile"
                :submit="handleSubmit"
            />
        </div>
    </t-card>
</template>
