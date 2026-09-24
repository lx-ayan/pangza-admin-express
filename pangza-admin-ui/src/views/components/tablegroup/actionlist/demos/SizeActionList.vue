<script setup lang="tsx">
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
];
</script>

<template>
    <div class="w-full space-y-6">
        <ActionList :options="options" size="small" />
        <ActionList :options="options" size="base" />
        <ActionList :options="options" size="large" />
    </div>
</template>
