<script setup lang="tsx">
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';

const options: ProTableOption[] = [
    { key: 'username', label: '用户名' },
    {
        key: 'status',
        label: '状态',
        type: 'select',
        data: [
            { label: '启用', value: '1' },
            { label: '禁用', value: '2' },
        ],
    },
    {
        key: 'deadline',
        label: '截止日期',
        type: 'datePicker',
        formProps: {
            datePickerProps: { style: { width: '100%' } },
        },
    },
    { key: 'email', label: '邮箱', hideInSearch: true },
    { key: 'matters', label: '明细', hideInSearch: true },
];

/**
 * 模拟带搜索条件的列表请求
 */
function request(params: ProTableRequest) {
    let list = Array.from({ length: 8 }).map((_, i) => ({
        id: String(i + 1),
        username: ['贾明', '张三', '王芳', '李雷'][i % 4],
        status: i % 2 === 0 ? '1' : '2',
        deadline: ['2025-11-19', '2025-11-20', '2025-11-21'][i % 3],
        email: `user${i + 1}@demo.com`,
        matters: ['宣传物料', '服务报销', '周边制作', '快递费用'][i % 4],
    }));

    const form = params.form || {};
    if (form.username) {
        list = list.filter((item) => item.username.includes(form.username));
    }
    if (form.status) {
        list = list.filter((item) => item.status === form.status);
    }

    return Promise.resolve({
        list: list.map((item) => ({
            ...item,
            status: item.status === '1' ? '启用' : '禁用',
        })),
        total: list.length,
    });
}
</script>

<template>
    <ProTable :options="options" :request="request">
        <template #pro-table-title>带搜索的表格</template>
    </ProTable>
</template>
