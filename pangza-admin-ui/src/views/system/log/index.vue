<script setup lang='tsx'>
import { exportSysLog, getSysLogPage } from '@/api/syslog';
import { DialogLink, ProTable, type ProTableInstance, type ProTableOption } from '@/components/ProComponents';
import CircleTag from '@/components/public/CircleTag/index.vue';
import Info from './components/Info/index.vue';
import { LOG_BUSINESS } from '@/utils/data/constant';
import { ref, useTemplateRef } from 'vue';


const proTableOption = ref<ProTableOption[]>([
    {
        key: 'id',
        label: '编号',
        hideInSearch: true,
        hideInTable: true
    },
    {
        key: 'title',
        label: '操作名称'
    },
    {
        key: 'username',
        label: '操作人'
    },
    {
        key: 'url',
        label: '接口路径',
        hideInSearch: true
    },
    {
        key: 'methodName',
        label: '请求方式'
    },
    {
        key: 'business',
        label: '操作类型',
        type: 'select',
        data: LOG_BUSINESS
    },
    {
        key: 'address',
        label: '地址',
        hideInSearch: true
    },
    {
        key: 'timeLong',
        label: '耗时（ms）',
        hideInSearch: true
    },
    {
        key: 'status',
        label: '状态',
        type: 'select',
        data: [
            { label: '成功', value: 1 },
            { label: '失败', value: 2 }
        ]
    },
    {
        key: 'ip',
        label: 'ip 地址',
        hideInSearch: true
    },
    {
        key: 'createTime',
        label: '请求时间',
        type: 'dateRangePicker'
    },
]);

const proTableRef = useTemplateRef<ProTableInstance>('proTableRef');

function request(data: any) {
    let param = {
        ...data
    }
    if (data.form.createTime) {
        const [beginDate, endDate] = data.form.createTime;
        param = {
            ...data,
            form: {
                ...data.form,
                beginDate,
                endDate
            }
        }
        param.form.createTime = undefined
    }
    return getSysLogPage(param);
}

function handleExportClick() {
    const data = proTableRef.value.getFormValue();
    exportSysLog(data).then((res) => {
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([res]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'styles.xlsx'); // 下载后的文件名
        document.body.appendChild(link);
        link.click();

        // 清理
        link.remove();
        window.URL.revokeObjectURL(url);
    })
}

</script>
<template>
    <div>
        <ProTable ref="proTableRef" :options="proTableOption" :request="request">
            <template #pro-table-title>
                <t-button @click="handleExportClick">导出</t-button>
            </template>
            <template #table-title="{ row }">
                <div>
                    <DialogLink theme="primary" hover="color" header="请求详情"
                        :dialog-props="{ width: '1200', footer: false }">
                        {{ row.title }}

                        <template #content>
                            <Info :data="row" />
                        </template>
                    </DialogLink>
                </div>
            </template>
            <template #table-status="{ row }">
                <CircleTag animation :color="row.status == '200' ? '#35B076' : '#F06161'">
                    {{ row.status == '200' ? '成功' : '失败' }}
                </CircleTag>
            </template>
        </ProTable>
    </div>
</template>