<script setup lang='tsx'>
import type { ProTableOption } from '@/components/ProComponents/ProTable/types';
import { Progress } from 'tdesign-vue-next';
interface TableData { id: number, name: string, area: string, count: number, progress: number, avatar: string };

const options: ProTableOption<TableData>[] = [
    {
        label: '名称',
        key: 'name',
        hideInSearch: true,
        tableProps: {
            width: '220'
        }
    },
    {
        label: '地区',
        key: 'area',
        hideInSearch: true
    },
    {
        label: '销售量',
        key: 'count',
        hideInSearch: true,
        tableProps: {
            align: 'right',
        }
    },
    {
        label: '完成度',
        key: 'progress',
        hideInSearch: true,
        tableProps: {
            width: '260'
        },
        render: (row) => {
            const count = Math.floor(row.count / 5000 * 100);

            function getColor(data: number) {
                if (data > 75) {
                    return '#20A867';
                } else if (data > 50) {
                    return 'var(--td-brand-color)';
                } else if (data > 30) {
                    return '#F0A020';
                } else {
                    return '#E9523E';
                }
            }

            return <div style={{ width: '200px' }}>
                <Progress color={getColor(count)} percentage={count}></Progress>
            </div>
        }
    }
]

function request() {
    return {
        list: [
            {
                id: 1,
                name: '刘续',
                area: '安徽淮北',
                count: 4123,
                avatar: 'https://images.unsplash.com/photo-1719558027686-04b38e96efaf?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
            },
            {
                id: 2,
                name: '张伟',
                area: '上海',
                count: 3120,
                avatar: 'https://images.unsplash.com/photo-1625799219697-870b418b4294?q=80&w=863&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
            },
            {
                id: 3,
                name: '王伟',
                area: '北京',
                count: 2888,
                avatar: 'https://images.unsplash.com/photo-1666866868698-67ee989fba70?q=80&w=747&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
            },
            {
                id: 4,
                name: '李勇',
                area: '安徽宿州',
                count: 2456,
                avatar: 'https://images.unsplash.com/photo-1524666041070-9d87656c25bb?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
            },
            {
                id: 5,
                name: '吴涛',
                area: '安徽安庆',
                count: 1988,
                avatar: 'https://images.unsplash.com/photo-1585145537001-4bfd5d32e669?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
            },
            {
                id: 6,
                name: '王刚',
                area: '江苏徐州',
                count: 1466,
                avatar: 'https://images.unsplash.com/photo-1596493688293-40dd1c5fa74d?q=80&w=682&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
            }
        ],

        total: 20
    }
}

</script>
<template>
    <GridItem :colSpan="12">
        <ProTable :request hidePage :options>
            <template #pro-table-title>
                <div class="mb-2">
                    销售排名
                </div>

            </template>
            <template #pro-table-actions>
                <div>
                    <t-radio-group default-value="1">
                        <t-radio-button value="1">本周</t-radio-button>
                        <t-radio-button value="2">本月</t-radio-button>
                        <t-radio-button value="3">今年</t-radio-button>
                    </t-radio-group>
                </div>
            </template>

            <template #table-name="{ row }: { row: TableData }">
                <div class="flex items-center">
                    <t-avatar :image="row.avatar" />
                    <span class="ml-3">{{ row.name }}</span>
                </div>
            </template>

        </ProTable>
    </GridItem>
</template>