<script setup lang='ts'>
import type { ProFormOption } from '@/components/ProComponents';
import { updatePassword } from '@/api/user';
import useUserStore from '@/store/userStore';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const userStore = useUserStore();

const options = ref<ProFormOption[]>([
    {
        name: 'oldPassword',
        label: '旧密码',
        rules: [
            { required: true, message: '请输入旧密码' }
        ],
        placeholder: '请输入',
        props: {
            inputProps: {
                type: 'password'
            }
        }
    },
    {
        name: 'newPassword',
        label: '新密码',
        rules: [
            { required: true, message: '请输入新密码' }
        ],
        placeholder: '请输入',
        props: {
            inputProps: {
                type: 'password'
            }
        }
    }
]);

/**
 * 修改密码成功后退出登录
 */
async function handleSubmit(data: UpdatePasswordDTO) {
    await updatePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
    });
    MessagePlugin.success('密码修改成功，请重新登录');
    await userStore.logout();
}
</script>
<template>
    <t-card :bordered="false">
        <div class="text-[#16192C] dark:text-white text-base font-normal mb-5">
            修改密码
        </div>

        <div>
            <ProForm
                hideReset
                submitText="修改密码"
                :formProps="{ labelAlign: 'top' }"
                :gap="{ x: 6, y: 8 }"
                :options="options"
                :submit="handleSubmit"
            />
        </div>
    </t-card>
</template>
