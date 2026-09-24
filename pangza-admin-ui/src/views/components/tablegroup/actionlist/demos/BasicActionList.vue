<script setup lang="tsx">
import { MessagePlugin } from 'tdesign-vue-next';

const options = [
    {
        value: 'profile',
        label: '个人资料',
        description: '查看并修改你的账户信息',
        icon: () => <MyIcon name="User" size={20} />,
    },
    {
        value: 'security',
        label: '安全设置',
        description: '密码、两步验证等相关设置',
        icon: () => <MyIcon name="Shield" size={20} />,
    },
    {
        value: 'notify',
        label: '消息通知',
        description: '管理系统通知与邮件提醒',
        icon: () => <MyIcon name="Bell" size={20} />,
    },
];

/**
 * 点击列表项
 */
function handleClick(value: string) {
    MessagePlugin.info(`点击了：${value}`);
}
</script>

<template>
    <ActionList :options="options" @click="handleClick" />
</template>
