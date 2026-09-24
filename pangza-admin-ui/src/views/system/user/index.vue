<script setup lang='tsx'>
import { createUser, deleteUser, getUser, getUserList, updateUser } from '@/api/user';
import TablePropsButton from '@/components/business/TablePropsButton/index.vue';
import TableOptionButton from '@/components/business/TableOptionButton/index.vue';
import TableSizeButton from '@/components/business/TableSizeButton/index.vue';
import TableShowSearchButton from '@/components/business/TableShowSearchButton/index.vue';
import BindRole from './components/BindRole/index.vue';
import { computed, ref, useTemplateRef } from 'vue';
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';
import type { ProTableInstance, ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';
import type { DialogLink, ModalForm, ProFormOption } from '@/components/ProComponents';
import useCreateOrUpdate from '@/hooks/core/useCreateOrUpdate';

const hideForm = ref(false);
const tablePropsButton = ref<string[]>([]);
const size = ref('medium');
const proTableRef = useTemplateRef<ProTableInstance>('proTableRef');

const [currentId, visible, { openModal, closeModal, request: formRequest }] = useCreateOrUpdate(getUser);

const formOptions = ref<ProFormOption[]>([
    {
        name: 'username',
        label: '用户名',
        rules: [
            { required: true, message: '请输入用户名' }
        ]
    },
    {
        name: 'nickName',
        label: '昵称',
        rules: [
            { required: true, message: '请输入昵称' }
        ]
    },
    {
        name: 'avatar',
        label: '头像'
    },
    {
        name: 'email',
        label: '邮箱'
    },
    {
        name: 'phone',
        label: '联系方式'
    },
    {
        name: 'address',
        label: '居住地址'
    }
]);

const options = ref<ProTableOption[]>([
    {
        key: 'nickName',
        label: '昵称',
        tableProps: {
            width: 320
        },
    },
    {
        key: 'phone',
        label: '联系方式',
    },
    {
        key: 'address',
        label: '居住地址',
        hideInSearch: true,
        tableProps: {
            width: 320
        },
    },
    {
        key: 'createTime',
        label: '出生日期',
        hideInSearch: true
    },
    {
        key: 'actions',
        label: '操作',
        hideInSearch: true
    }
])

function request(data: ProTableRequest) {
    return getUserList(data);
}

const tableProps = computed(() => ({
    bordered: tablePropsButton.value.includes('border'),
    stripe: tablePropsButton.value.includes('stripe'),
    hover: tablePropsButton.value.includes('hover'),
    size: size.value
}));

function handleSubmit(data: CreateUserDTO) {
    const fn = currentId.value ? updateUser : createUser;
    const param: CreateUserDTO = {
        ...data
    }

    if (currentId.value) {
        (param as unknown as User).id = currentId.value;
    }

    fn(param).then(() => {
        closeModal();
        proTableRef.value.reset();
        MessagePlugin.success('操作成功');
    })
}

function handleDelete(instance: DialogInstance, row: User) {
    deleteUser(row.id).then(() => {
        instance.destroy();
        proTableRef.value.reset();
        MessagePlugin.success('删除成功');
    })
}

</script>
<template>
    <div>
        <ModalForm @submit="handleSubmit" :header="currentId ? '修改用户' : '创建用户'" :options="formOptions"
            :request="formRequest" v-model:visible="visible">
        </ModalForm>
        <ProTable ref="proTableRef" :hideForm :tableProps="{ size: 'small', ...tableProps }" :request="request"
            :options>
            <template #pro-table-title>
                <t-button @click="() => openModal(null)">
                    新增用户
                </t-button>
            </template>

            <template #pro-table-actions>
                <t-space>
                    <TableOptionButton v-model="options" />
                    <TableSizeButton v-model="size" />
                    <TablePropsButton v-model="tablePropsButton" />
                    <TableShowSearchButton v-model="hideForm" />
                </t-space>
            </template>
            <template #table-nickName="{ row }">
                <t-space class="items-center">
                    <t-image :style="{ width: '40px', height: '40px' }" class="rounded-lg" fit="cover"
                        :src="row.avatar"></t-image>
                    <div>
                        <div>{{ row.nickName }} ({{ row.username }})</div>
                        <div class="text-[var(--td-text-color-secondary)]">{{ row.email }}</div>
                    </div>
                </t-space>
            </template>
            <template #table-actions="{ row }">
                <t-space>
                    <t-link @click="() => openModal(row.id)" hover="color" theme="primary">编辑</t-link>
                    <BindRole :user-id="row.id" />
                    <DialogLink theme="danger" @confirm="(instance: DialogInstance) => handleDelete(instance, row)"
                        header="系统提示" hover="color" content="是否删除当前数据？">删除</DialogLink>
                </t-space>
            </template>
        </ProTable>
    </div>
</template>
