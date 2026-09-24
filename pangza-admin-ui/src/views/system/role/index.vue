<script setup lang='tsx'>
import TablePropsButton from '@/components/business/TablePropsButton/index.vue';
import TableOptionButton from '@/components/business/TableOptionButton/index.vue';
import TableSizeButton from '@/components/business/TableSizeButton/index.vue';
import TableShowSearchButton from '@/components/business/TableShowSearchButton/index.vue';
import { computed, ref, useTemplateRef } from 'vue';
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';
import BindMenu from './components/BindMenu/index.vue';
import type { ProTableInstance, ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';
import { createRole, deleteRole, getRole, getRoleMenuIds, getRolePage, updateRole } from '@/api/role';
import type { CreateRoleDTO, GetRolePageDTO, UpdateRoleDTO } from '@/types/api/role';
import { DialogLink, ModalForm, type ProFormOption } from '@/components/ProComponents';

const proTableOptions = ref<ProTableOption[]>([
    {
        key: 'name',
        label: '角色标识',
        tableProps: {
            width: 320
        },
    },
    {
        key: 'nameZh',
        label: '角色名称',
        hideInSearch: true,
    },
    {
        key: 'description',
        label: '角色描述',
        hideInSearch: true,
        tableProps: {
            width: 320
        },
    },
    {
        key: 'actions',
        label: '操作',
        tableProps: {
            width: '240'
        },
        hideInSearch: true
    }
]);

const proFormOptions = ref<ProFormOption[]>([
    {
        name: 'name',
        label: '角色标识',
        rules: [
            { required: true, message: '请输入角色标识', trigger: 'blur' }
        ]
    },
    {
        name: 'nameZh',
        label: '角色名称',
        rules: [
            { required: true, message: '请输入角色名称', trigger: 'blur' }
        ]
    },
    {
        name: 'description',
        label: '角色描述',
        type: 'textarea',
        placeholder: '请输入描述'
    }
])

const hideForm = ref(false);
const tablePropsButton = ref<string[]>([]);
const size = ref('medium');
const visible = ref(false);

const currentId = ref<Nullable<string>>(null);

const proTableRef = useTemplateRef<ProTableInstance>('proTableRef');

function request(data: ProTableRequest<GetRolePageDTO>) {
    return getRolePage(data);
}

const tableProps = computed(() => ({
    bordered: tablePropsButton.value.includes('border'),
    stripe: tablePropsButton.value.includes('stripe'),
    hover: tablePropsButton.value.includes('hover'),
    size: size.value
}))

async function modalRequest() {
    if (currentId.value == null) {
        return null;
    } else {
        return getRole(currentId.value)
    }
}

function openModal(id: Nullable<string>) {
    currentId.value = id;
    visible.value = true;
}

function handleSubmit(data: CreateRoleDTO | UpdateRoleDTO) {
    const fn = currentId.value ? updateRole : createRole;
    const param: CreateRoleDTO = {
        ...data
    }

    if (currentId.value) {
        (param as unknown as UpdateRoleDTO).id = currentId.value;
    }

    fn(param as ParamType<typeof fn>).then(() => {
        proTableRef.value?.reset();
        visible.value = false;
        MessagePlugin.success('操作成功');
    })
}

function handleDelete(id: string, instance: DialogInstance) {
    deleteRole(id).then(() => {
        MessagePlugin.success('删除成功');
        proTableRef.value?.reset();
        instance.destroy();
    })
}

</script>
<template>
    <div class="">
        <ModalForm @submit="handleSubmit" :header="currentId ? '修改角色' : '创建角色'" :request="modalRequest"
            v-model:visible="visible" :options="proFormOptions"></ModalForm>
        <ProTable ref="proTableRef" :hideForm :tableProps="{ size: 'small', ...tableProps }" :request="request"
            :options="proTableOptions">
            <template #pro-table-title>
                <t-button @click="() => openModal(null)">
                    新增角色
                </t-button>
            </template>

            <template #pro-table-actions>
                <t-space>
                    <TableOptionButton v-model="proTableOptions" />
                    <TableSizeButton v-model="size" />
                    <TablePropsButton v-model="tablePropsButton" />
                    <TableShowSearchButton v-model="hideForm" />
                </t-space>
            </template>
            <template #table-username="{ row }">
                <t-space class="items-center">
                    <t-image :style="{ width: '40px', height: '40px' }" class="rounded-lg" fit="cover"
                        :src="row.avatar"></t-image>
                    <div>
                        <div>{{ row.username }}</div>
                        <div>{{ row.email }}</div>
                    </div>
                </t-space>
            </template>
            <template #table-actions="{ row }">
                <t-space>
                    <t-link @click="() => openModal(row.id)" hover="color" theme="primary">编辑</t-link>
                    <BindMenu :roleId="row.id" theme="primary" />
                    <DialogLink hover="color" content="是否删除当前数据" header="系统提示" theme="danger"
                        @confirm="(instance: DialogInstance) => handleDelete(row.id, instance)">
                        删除
                    </DialogLink>
                    <!-- <t-link @click="() => MessagePlugin.error('删除:' + JSON.stringify(row))" hover="color"
                        theme="danger">删除</t-link> -->
                </t-space>
            </template>
        </ProTable>
    </div>
</template>