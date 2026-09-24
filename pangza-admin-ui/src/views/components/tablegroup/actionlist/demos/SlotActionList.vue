<script setup lang="tsx">
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const notifyEnabled = ref(true);

const options = [
    {
        value: 'email',
        label: '邮箱绑定',
        description: '用于接收重要通知',
        icon: () => <MyIcon name="Mail" size={20} />,
    },
    {
        value: 'notify',
        label: '消息推送',
        description: '开启后可接收实时消息',
        icon: () => <MyIcon name="Bell" size={20} />,
    },
    {
        value: 'danger',
        label: '注销账号',
        description: '注销后数据将无法恢复',
        icon: () => <MyIcon name="Trash2" size={20} />,
    },
];

/**
 * 模拟跳转 / 操作
 */
function handleBind() {
    MessagePlugin.success('已打开绑定流程');
}
</script>

<template>
    <ActionList :options="options">
        <template #action-email>
            <t-link theme="primary" hover="color" @click="handleBind">去绑定</t-link>
        </template>

        <template #action-notify>
            <t-switch v-model="notifyEnabled" />
        </template>

        <template #action-danger>
            <t-link theme="danger" hover="color">注销</t-link>
        </template>
    </ActionList>
</template>
