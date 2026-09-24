<script setup lang="tsx">
import {
    getSysConfigPage,
    refreshSysConfigCache,
    updateSysConfig,
    type SysConfigItem,
} from '@/api/sysConfig';
import { ModalForm, ProTable, type ProFormOption, type ProTableInstance, type ProTableOption } from '@/components/ProComponents';
import CircleTag from '@/components/public/CircleTag/index.vue';
import { EncryptConstants } from '@/utils/data/encrypt';
import { refreshEncryptConfig } from '@/utils/core/encryptTransport';
import { FormItem, MessagePlugin, Switch } from 'tdesign-vue-next';
import { computed, ref, useTemplateRef } from 'vue';

const visible = ref(false);
const current = ref<SysConfigItem | null>(null);
const proTableRef = useTemplateRef<ProTableInstance>('proTableRef');
const switchingId = ref('');

const proTableOptions = ref<ProTableOption[]>([
    {
        key: 'id',
        label: '编号',
        hideInSearch: true,
        hideInTable: true,
    },
    {
        key: 'keyword',
        label: '关键词',
        hideInTable: true,
        formProps: {
            placeholder: '配置键 / 名称 / 备注',
        },
    },
    {
        key: 'configKey',
        label: '配置键',
        hideInSearch: true,
        tableProps: { width: 240 },
    },
    {
        key: 'configName',
        label: '配置名称',
        hideInSearch: true,
        tableProps: { width: 160 },
    },
    {
        key: 'configValue',
        label: '配置值',
        hideInSearch: true,
        tableProps: { minWidth: 180 },
    },
    {
        key: 'configType',
        label: '类型',
        hideInSearch: true,
        tableProps: { width: 100 },
    },
    {
        key: 'publicFlag',
        label: '公开',
        hideInSearch: true,
        tableProps: { width: 100 },
    },
    {
        key: 'remark',
        label: '备注',
        hideInSearch: true,
        tableProps: { minWidth: 200, ellipsis: true },
    },
    {
        key: 'actions',
        label: '操作',
        hideInSearch: true,
        tableProps: { width: 100, fixed: 'right' },
    },
]);

/** 当前是否为布尔配置（加密开关等） */
const isBooleanConfig = computed(() => current.value?.configType === 'boolean');

const formOptions = computed<ProFormOption[]>(() => {
    const valueOption: ProFormOption = isBooleanConfig.value
        ? {
            name: 'configValue',
            label: '配置值',
            // 由插槽渲染 Switch
        }
        : {
            name: 'configValue',
            label: '配置值',
            type: 'input',
            placeholder: '请输入配置值',
            rules: [{ required: true, message: '请输入配置值', trigger: 'blur' }],
        };

    return [
        {
            name: 'configName',
            label: '配置名称',
            rules: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
        },
        valueOption,
        {
            name: 'remark',
            label: '备注',
            type: 'textarea',
        },
        {
            name: 'publicFlag',
            label: '是否公开',
            type: 'radio',
            data: [
                { label: '是', value: 1 },
                { label: '否', value: 0 },
            ],
        },
        {
            name: 'sortNum',
            label: '排序',
            type: 'inputNumber',
            props: { min: 0 },
        },
    ];
});

function request(data: any) {
    return getSysConfigPage(data);
}

function isBooleanRow(row: SysConfigItem) {
    return row.configType === 'boolean';
}

function toSwitchValue(value?: string) {
    return value === 'true';
}

function openEdit(row: SysConfigItem) {
    current.value = {
        ...row,
        // Switch 使用 boolean，提交时再转回字符串
        configValue: isBooleanRow(row) ? (toSwitchValue(row.configValue) as any) : row.configValue,
    };
    visible.value = true;
}

async function persistConfig(payload: {
    id: string;
    configName?: string;
    configValue: string;
    remark?: string;
    publicFlag?: number;
    sortNum?: number;
}) {
    await updateSysConfig(payload);
    if (payload.id === 'sys_config_encrypt_enabled'
        || current.value?.configKey === EncryptConstants.CONFIG_ENCRYPT_ENABLED) {
        await refreshEncryptConfig();
    }
}

async function handleSubmit(data: Record<string, unknown>) {
    if (!current.value?.id) {
        return;
    }
    const rawValue = data.configValue;
    const configValue = typeof rawValue === 'boolean'
        ? String(rawValue)
        : String(rawValue ?? '');

    await persistConfig({
        id: current.value.id,
        configName: data.configName as string,
        configValue,
        remark: data.remark as string,
        publicFlag: Number(data.publicFlag ?? 0),
        sortNum: Number(data.sortNum ?? 0),
    });
    MessagePlugin.success('保存成功');
    visible.value = false;
    proTableRef.value?.reload();
}

async function handleSwitchChange(row: SysConfigItem, checked: boolean) {
    if (switchingId.value === row.id) {
        return;
    }
    switchingId.value = row.id;
    try {
        await persistConfig({
            id: row.id,
            configName: row.configName,
            configValue: String(checked),
            remark: row.remark,
            publicFlag: row.publicFlag,
            sortNum: row.sortNum,
        });
        row.configValue = String(checked);
        MessagePlugin.success(checked ? '已开启' : '已关闭');
        if (row.configKey === EncryptConstants.CONFIG_ENCRYPT_ENABLED) {
            await refreshEncryptConfig();
        }
    } catch {
        // 失败时靠 reload 回滚展示
        proTableRef.value?.reload();
    } finally {
        switchingId.value = '';
    }
}

async function handleRefreshCache() {
    await refreshSysConfigCache();
    await refreshEncryptConfig();
    MessagePlugin.success('缓存已刷新');
    proTableRef.value?.reload();
}

async function modalRequest() {
    return current.value;
}
</script>

<template>
    <div>
        <ProTable
            ref="proTableRef"
            :options="proTableOptions"
            :request="request"
        >
            <template #pro-table-title>
                <t-button theme="default" variant="outline" @click="handleRefreshCache">
                    刷新缓存
                </t-button>
            </template>
            <template #table-configValue="{ row }">
                <Switch
                    v-if="isBooleanRow(row)"
                    :value="toSwitchValue(row.configValue)"
                    :loading="switchingId === row.id"
                    @change="(checked: boolean) => handleSwitchChange(row, checked)"
                />
                <span v-else>{{ row.configValue }}</span>
            </template>
            <template #table-publicFlag="{ row }">
                <CircleTag
                    animation
                    :color="row.publicFlag === 1 ? '#35B076' : '#999999'"
                >
                    {{ row.publicFlag === 1 ? '公开' : '私有' }}
                </CircleTag>
            </template>
            <template #table-actions="{ row }">
                <t-link hover="color" theme="primary" @click="openEdit(row)">
                    编辑
                </t-link>
            </template>
        </ProTable>

        <ModalForm
            v-model:visible="visible"
            header="编辑系统配置"
            :options="formOptions"
            :request="modalRequest"
            @submit="handleSubmit"
        >
            <template v-if="isBooleanConfig" #form-configValue="{ data }">
                <FormItem label="配置值" name="configValue">
                    <Switch v-model="data.configValue" />
                </FormItem>
            </template>
        </ModalForm>
    </div>
</template>
