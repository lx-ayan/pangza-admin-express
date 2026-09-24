<script setup lang='tsx'>
import TablePropsButton from '@/components/business/TablePropsButton/index.vue';
import TableOptionButton from '@/components/business/TableOptionButton/index.vue';
import TableSizeButton from '@/components/business/TableSizeButton/index.vue';
import TableShowSearchButton from '@/components/business/TableShowSearchButton/index.vue';
import CircleTag from '@/components/public/CircleTag/index.vue';
import { computed, ref, useTemplateRef } from 'vue';
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';
import type { ProTableInstance, ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';
import { DialogLink, ModalForm, type ProFormOption } from '@/components/ProComponents';
import {
    createSchedule,
    deleteSchedule,
    getSchedule,
    getSchedulePage,
    runSchedule,
    updateSchedule,
} from '@/api/schedule';
import type { CreateScheduleDTO, GetSchedulePageDTO, UpdateScheduleDTO } from '@/types/api/schedule';

const SCHEDULE_STATUS = [
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
];

const hideForm = ref(false);
const tablePropsButton = ref<string[]>([]);
const size = ref('medium');
const visible = ref(false);
const currentId = ref<Nullable<string>>(null);
const proTableRef = useTemplateRef<ProTableInstance>('proTableRef');
const runningId = ref('');

const proTableOptions = ref<ProTableOption[]>([
    {
        key: 'id',
        label: '编号',
        hideInSearch: true,
        hideInTable: true,
    },
    {
        key: 'title',
        label: '任务标题',
        tableProps: {
            width: 200,
        },
    },
    {
        key: 'cron',
        label: 'Cron 表达式',
        tableProps: {
            width: 160,
        },
    },
    {
        key: 'beanName',
        label: '执行类',
        hideInSearch: true,
        tableProps: {
            width: 180,
        },
    },
    {
        key: 'description',
        label: '任务描述',
        hideInSearch: true,
        tableProps: {
            width: 280,
            ellipsis: true,
        },
    },
    {
        key: 'status',
        label: '状态',
        type: 'select',
        data: SCHEDULE_STATUS,
        defaultValue: 1,
        tableProps: {
            width: 100,
        },
    },
    {
        key: 'createTime',
        label: '创建时间',
        hideInSearch: true,
        tableProps: {
            width: 180,
        },
    },
    {
        key: 'actions',
        label: '操作',
        hideInSearch: true,
        tableProps: {
            width: 220,
            fixed: 'right',
        },
    },
]);

const proFormOptions = ref<ProFormOption[]>([
    {
        name: 'title',
        label: '任务标题',
        rules: [
            { required: true, message: '请输入任务标题', trigger: 'blur' },
        ],
    },
    {
        name: 'cron',
        label: 'Cron 表达式',
        placeholder: '例如：0 0 2 * * ?',
        rules: [
            { required: true, message: '请输入 Cron 表达式', trigger: 'blur' },
        ],
    },
    {
        name: 'beanName',
        label: '执行类',
        placeholder: '例如：sysLogCleanTask',
        rules: [
            { required: true, message: '请输入执行类', trigger: 'blur' },
        ],
    },
    {
        name: 'status',
        label: '状态',
        type: 'select',
        data: SCHEDULE_STATUS,
        defaultValue: 1,
        rules: [
            { required: true, message: '请选择状态', trigger: 'change' },
        ],
    },
    {
        name: 'description',
        label: '任务描述',
        type: 'textarea',
        placeholder: '请输入任务描述',
    },
]);

function request(data: ProTableRequest<GetSchedulePageDTO>) {
    return getSchedulePage(data);
}

const tableProps = computed(() => ({
    bordered: tablePropsButton.value.includes('border'),
    stripe: tablePropsButton.value.includes('stripe'),
    hover: tablePropsButton.value.includes('hover'),
    size: size.value,
}));

async function modalRequest() {
    if (currentId.value == null) {
        return null;
    }
    return getSchedule(currentId.value);
}

function openModal(id: Nullable<string>) {
    currentId.value = id;
    visible.value = true;
}

function handleSubmit(data: Record<string, unknown>) {
    const fn = currentId.value ? updateSchedule : createSchedule;
    const param = {
        title: data.title as string,
        cron: data.cron as string,
        beanName: data.beanName as string,
        description: (data.description as string) || '',
        status: Number(data.status ?? 1),
        ...(currentId.value ? { id: currentId.value } : {}),
    };

    fn(param as ParamType<typeof fn>).then(() => {
        proTableRef.value?.reset();
        visible.value = false;
        MessagePlugin.success('操作成功');
    });
}

function handleDelete(id: string, instance: DialogInstance) {
    deleteSchedule(id).then(() => {
        MessagePlugin.success('删除成功');
        proTableRef.value?.reset();
        instance.destroy();
    });
}

function handleRun(id: string) {
    if (runningId.value === id) {
        return;
    }
    runningId.value = id;
    runSchedule(id)
        .then(() => {
            MessagePlugin.success('已立即执行一次（未改变启停状态）');
        })
        .finally(() => {
            runningId.value = '';
        });
}

function getStatusMeta(status: number) {
    return status === 1
        ? { text: '启用', color: '#35B076' }
        : { text: '停用', color: '#F06161' };
}

</script>

<template>
    <div>
        <ModalForm
            v-model:visible="visible"
            :header="currentId ? '修改定时任务' : '新增定时任务'"
            :options="proFormOptions"
            :request="modalRequest"
            width="560"
            @submit="handleSubmit"
        />
        <ProTable
            ref="proTableRef"
            :hideForm
            :options="proTableOptions"
            :request="request"
            :tableProps="{ size: 'small', ...tableProps }"
        >
            <template #pro-table-title>
                <t-space>
                    <t-button @click="() => openModal(null)">
                        新增任务
                    </t-button>
                    <t-tag theme="warning" variant="light">
                        停用状态不会按 Cron 调度；点「执行」仅立即跑一次，不会自动启用
                    </t-tag>
                </t-space>
            </template>

            <template #pro-table-actions>
                <t-space>
                    <TableOptionButton v-model="proTableOptions" />
                    <TableSizeButton v-model="size" />
                    <TablePropsButton v-model="tablePropsButton" />
                    <TableShowSearchButton v-model="hideForm" />
                </t-space>
            </template>

            <template #table-status="{ row }">
                <t-space class="items-center">
                    <CircleTag animation :color="getStatusMeta(row.status).color" />
                    <span>{{ getStatusMeta(row.status).text }}</span>
                </t-space>
            </template>

            <template #table-actions="{ row }">
                <t-space>
                    <t-link
                        hover="color"
                        theme="primary"
                        :disabled="runningId === row.id"
                        @click="() => handleRun(row.id)"
                    >
                        执行
                    </t-link>
                    <t-link hover="color" theme="primary" @click="() => openModal(row.id)">
                        编辑
                    </t-link>
                    <DialogLink
                        content="是否删除当前定时任务？"
                        header="系统提示"
                        hover="color"
                        theme="danger"
                        @confirm="(instance: DialogInstance) => handleDelete(row.id, instance)"
                    >
                        删除
                    </DialogLink>
                </t-space>
            </template>
        </ProTable>
    </div>
</template>
