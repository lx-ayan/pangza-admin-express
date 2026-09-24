<script setup lang="tsx">
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';

const options: ProTableOption[] = [
    { key: 'username', label: '用户名' },
    { key: 'matters', label: '明细', hideInSearch: true },
    { key: 'channel', label: '签署方式', hideInSearch: true },
    { key: 'createTime', label: '创建时间', hideInSearch: true },
];

/**
 * 模拟可拖拽表格数据
 */
function request(_params: ProTableRequest) {
    const list = Array.from({ length: 6 }).map((_, i) => ({
        id: String(i + 1),
        username: ['贾明', '张三', '王芳', '李雷', '韩梅', '赵六'][i],
        matters: ['宣传物料', '服务报销', '周边制作', '快递费用', '差旅申请', '办公采购'][i],
        channel: ['电子签署', '纸质签署'][i % 2],
        createTime: ['2022-01-01', '2022-02-01', '2022-03-01'][i % 3],
    }));
    return Promise.resolve({ list, total: list.length });
}
</script>

<template>
    <ProTable
        dragg-able
        row-key="id"
        :options="options"
        :request="request"
        :hide-form="true"
    >
        <template #pro-table-title>拖拽左侧图标调整顺序</template>
    </ProTable>
</template>
