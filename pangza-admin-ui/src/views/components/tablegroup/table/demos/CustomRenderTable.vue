<script setup lang="tsx">
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';
import CircleTag from '@/components/public/CircleTag/index.vue';

const options: ProTableOption[] = [
    {
        key: 'username',
        label: '用户名',
        render: (row) => <t-link hover="color" theme="primary">{row.username}</t-link>,
    },
    {
        key: 'avatar',
        label: '头像',
        hideInSearch: true,
        render: (row) => (
            <t-image
                src={row.avatar}
                fit="cover"
                style={{ width: '40px', height: '40px', borderRadius: '6px' }}
            />
        ),
    },
    {
        key: 'status',
        label: '状态',
        type: 'select',
        data: [
            { label: '启用', value: '启用' },
            { label: '禁用', value: '禁用' },
        ],
        render: (row) => (
            <CircleTag
                animation
                color={row.status === '启用' ? 'var(--td-success-color)' : 'var(--td-error-color)'}
            >
                {row.status}
            </CircleTag>
        ),
    },
    { key: 'email', label: '邮箱', hideInSearch: true },
    { key: 'action', label: '操作', hideInSearch: true },
];

/**
 * 模拟自定义列渲染数据
 */
function request(_params: ProTableRequest) {
    const avatars = [
        'https://tdesign.gtimg.com/demo/demo-image-1.png',
        'https://tdesign.gtimg.com/demo/demo-image-2.png',
        'https://tdesign.gtimg.com/demo/demo-image-3.png',
    ];
    const list = Array.from({ length: 5 }).map((_, i) => ({
        id: String(i + 1),
        username: ['贾明', '张三', '王芳', '李雷', '韩梅'][i],
        avatar: avatars[i % avatars.length],
        status: i % 2 === 0 ? '启用' : '禁用',
        email: `user${i + 1}@demo.com`,
    }));
    return Promise.resolve({ list, total: list.length });
}
</script>

<template>
    <ProTable :options="options" :request="request" :hide-form="true">
        <template #table-action>
            <t-space>
                <t-link hover="color" theme="primary">编辑</t-link>
                <t-link hover="color" theme="danger">删除</t-link>
            </t-space>
        </template>
    </ProTable>
</template>
