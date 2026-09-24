<script setup lang="tsx">
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';

const options: ProTableOption[] = [
    { key: 'username', label: '用户名' },
    { key: 'email', label: '邮箱', hideInSearch: true },
    { key: 'phone', label: '手机号', hideInSearch: true },
    { key: 'address', label: '地址', hideInSearch: true },
];

/**
 * 模拟基础列表请求
 */
function request(_params: ProTableRequest) {
    const list = Array.from({ length: 5 }).map((_, i) => ({
        id: String(i + 1),
        username: ['贾明', '张三', '王芳', '李雷', '韩梅'][i],
        email: ['a@demo.com', 'b@demo.com', 'c@demo.com', 'd@demo.com', 'e@demo.com'][i],
        phone: ['13800000001', '13800000002', '13800000003', '13800000004', '13800000005'][i],
        address: ['北京', '上海', '广州', '深圳', '杭州'][i],
    }));
    return Promise.resolve({ list, total: list.length });
}
</script>

<template>
    <ProTable :options="options" :request="request" :hide-form="true" />
</template>
