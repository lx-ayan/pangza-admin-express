<script setup lang='tsx'>
import { deleteMenu, getMenuPage } from '@/api/menu';
import type { DialogLink, ProTableInstance, ProTableOption } from '@/components/ProComponents';
import type { MenuPageVO } from '@/types/api/menu';
import { filterByValue } from '@/utils/core';
import { AUTH_TYPE, MENU_TYPE } from '@/utils/data/constant';
import { ref, useTemplateRef } from 'vue';
import CreateModal from './components/CreateModal/index.vue';
import UpdateModal from './components/UpdateModal/index.vue';
import BindRole from './components/BindRole/index.vue';
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';

const tableRef = useTemplateRef<ProTableInstance>('tableRef');

const updateModalRef = useTemplateRef<InstanceType<typeof UpdateModal>>('updateModalRef');

const taleData = ref<MenuPageVO[]>([]);

const id = ref('');

const proTableOptions = ref<ProTableOption<MenuPageVO>[]>([
    {
        key: 'id',
        label: '菜单ID',
        hideInSearch: true,
        hideInTable: true
    },
    {
        key: 'title',
        label: '菜单标题',
        tableProps: {
            width: '160',
        },
    },
    {
        key: 'name',
        label: '菜单名称',
    },
    {
        key: 'type',
        label: '菜单类型',
        tableProps: {
            width: '100',
        },
        render: (row) => {
            return <div>{filterByValue(MENU_TYPE, row.type, '目录')}</div>
        }
    },
    {
        key: 'path',
        label: '路径',
        hideInSearch: true
    },
    {
        key: 'permission',
        label: '权限标识',
        hideInSearch: true,
    },
    {
        key: 'auth',
        label: '是否认证',
        hideInSearch: true,
        tableProps: {
            width: '100',
        },
        render: (row) => {
            return <div>{filterByValue(AUTH_TYPE, row.auth, '需要')}</div>
        }
    },
    {
        key: 'parentTitle',
        label: '父级菜单',
        hideInSearch: true,
        tableProps: {
            width: '160',
        },
    },
    {
        key: 'actions',
        label: '操作',
        hideInSearch: true
    }
]);

function handleOpenUpdateModal(row: MenuPageVO) {
    id.value = row.id!;
    updateModalRef.value?.open();
}

function handleDeleteConfirm(id: string, instance: DialogInstance) {
    deleteMenu(id).then(() => {
        MessagePlugin.success('删除成功');
        instance.destroy();
        tableRef.value?.reset();
    }).catch(e => {
        MessagePlugin.error(e || '删除失败');
    })
}

function handleFinish() {
    tableRef.value?.reset();
}

</script>
<template>
    <div class="h-full">
        <UpdateModal @finish="handleFinish" ref="updateModalRef" :id="id" v-permission="['ROLE_admin']" />
        <ProTable v-model:data="taleData" ref="tableRef" :options="proTableOptions" :request="getMenuPage">
            <template #pro-table-title>
                <div v-permission="['ROLE_admin']">
                    <CreateModal @finish="handleFinish" />
                </div>
            </template>

            <template #table-actions="{ row }">
                <t-space>
                    <t-link @click="() => handleOpenUpdateModal(row)" v-permission="['ROLE_admin']" theme="primary"
                        hover="color">修改</t-link>
                    <BindRole :menu-id="row.id" :menu-title="row.title" v-permission="['ROLE_admin']" />
                    <DialogLink @confirm="(instance: DialogInstance) => handleDeleteConfirm(row.id, instance)"
                        header="系统提示" content="是否删除当前数据？" hover="color" theme="danger">删除</DialogLink>
                </t-space>
            </template>
        </ProTable>
    </div>
</template>