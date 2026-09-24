<script setup lang="tsx">
import { ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';

const selectData = ref<{ values?: (string | number)[] }>({ values: [] });

const options: ProTableOption[] = [
    { key: 'username', label: '用户名' },
    { key: 'channel', label: '签署方式', hideInSearch: true },
    { key: 'price', label: '价格', tableTitle: '房源价格（万）', hideInSearch: true },
    { key: 'createTime', label: '创建时间', hideInSearch: true },
];

/**
 * 模拟可选择表格数据
 */
function request(_params: ProTableRequest) {
    const list = Array.from({ length: 6 }).map((_, i) => ({
        id: String(i + 1),
        username: ['贾明', '张三', '王芳'][i % 3],
        channel: ['电子签署', '纸质签署'][i % 2],
        price: [55, 25, 30, 52, 12, 32][i],
        createTime: ['2022-01-01', '2022-02-01', '2022-03-01'][i % 3],
    }));
    return Promise.resolve({ list, total: list.length });
}

/**
 * 导出当前选中行
 */
function handleExport() {
    const keys = selectData.value.values || [];
    if (!keys.length) {
        MessagePlugin.warning('请先勾选数据');
        return;
    }
    MessagePlugin.success(`已导出 ${keys.length} 条：${keys.join(', ')}`);
}
</script>

<template>
    <ProTable
        v-model:select-data="selectData"
        select-able
        row-key="id"
        :options="options"
        :request="request"
        :hide-form="true"
    >
        <template #pro-table-title>可选中表格</template>
        <template #pro-table-actions>
            <t-button theme="primary" @click="handleExport">导出选中</t-button>
        </template>
    </ProTable>
</template>
