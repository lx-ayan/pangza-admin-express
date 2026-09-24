<script setup lang='tsx'>
import type { ProTableOption } from '@/components/ProComponents/ProTable/types';
import CircleTag from '@/components/public/CircleTag/index.vue';

const options: ProTableOption[] = [
    {
        key: 'username',
        label: '用户名',
        render: (row) => {
            return <t-link hover="color" theme="primary">{row.username}</t-link>
        }
    },
    {
        key: 'deadline',
        label: '截止日期',
        type: 'datePicker',
        formProps: {
            datePickerProps: {
                style: {
                    width: '100%'
                }
            }
        }
    },
    {
        key: 'email',
        label: '邮箱',
    },
    {
        key: 'matters',
        label: '明细',
        hideInSearch: true
    },
    {
        key: 'channel',
        label: '签署方式',
        hideInSearch: true,
    },
    {
        key: 'price',
        label: '房源价格',
        tableTitle: '房源价格（万）',
        type: 'checkbox',
        span: 24,
        data: () => {
            return Promise.resolve([
                { label: '10~20 万', value: '1' },
                { label: '20~30 万', value: '2' },
                { label: '30~40 万', value: '3' },
                { label: '40~50 万', value: '4' },
                { label: '50~60 万', value: '5' },
                { label: '60~70 万', value: '6' },
                { label: '更多', value: '7' },
            ])
        }
    },

    {
        key: 'status',
        label: '状态',
        type: 'select',
        data: [
            { label: '启用', value: '1' },
            { label: '禁用', value: '2' }
        ],
        render: (row) => {
            return <CircleTag animation color={row.status === '启用' ? 'var(--td-success-color)' : 'var(--td-error-color)'}>
                {row.status}
            </CircleTag>
        }
    },
    {
        key: 'action',
        label: '操作',
        hideInSearch: true
    }
]

function request() {
    const data = [];
    const total = 28;
    for (let i = 0; i < 10; i++) {
        data.push({
            id: i + 1,
            username: ['贾明', '张三', '王芳'][i % 3],
            status: ['启用', '禁用'][i % 2],
            deadline: ['2025-11-19', '2025-11-20', '2025-11-21'][i % 3],
            price: [55, 25, 30, 52, 12, 32][i % 3],
            matters: ['宣传物料制作费用', 'algolia 服务报销', '相关周边制作费', '激励奖品快递费'][i % 4],
            channel: ['电子签署', '纸质签署', '纸质签署'][i % 3],
            email: ['w.cezkdudy@lhll.au', 'r.nmgw@peurezgn.sl', 'p.cumx@rampblpa.ru'][i % 3],
            createTime: ['2022-01-01', '2022-02-01', '2022-03-01', '2022-04-01', '2022-05-01'][i % 4],
        });
    }

    return {
        total,
        list: data
    }
}

</script>
<template>
    <div>
        <ProTable :request :options>
            <template #pro-table-title>
                <div>高级表格</div>
            </template>
            <template #pro-table-actions>
                <t-button>导出数据</t-button>
            </template>
            <template #table-action>
                <t-space>
                    <t-link hover="color" theme="primary">编辑</t-link>
                    <t-link hover="color" theme="danger">删除</t-link>
                </t-space>
            </template>
        </ProTable>
    </div>
</template>