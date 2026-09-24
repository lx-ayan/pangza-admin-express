<script setup lang='ts'>
import { ModalForm, type ModalFormInstance, type ProFormInputNumberProps, type ProFormOption } from '@/components/ProComponents';
import IconChoose from '@/components/business/IconChoose/index.vue';
import { onMounted, ref, useTemplateRef } from 'vue';
import { formOptions } from '../options';
import type { CreateMenuDTO, MenuResult } from '@/types/api/menu';
import { createMenu, getMenuWithChildren } from '@/api/menu';
import { MessagePlugin, type TdInputNumberProps } from 'tdesign-vue-next';
import { MENU_TYPE, YES_OR_NO } from '@/utils/data/constant';
const modalFormInstance = useTemplateRef<ModalFormInstance>('modalFormInstance');
const options = ref<ProFormOption[]>([
    {
        name: 'name',
        label: '菜单名称',
        gridProps: {
            colSpan: 12
        },
        rules: [
            { required: true, message: '请输入菜单名称' }
        ],
        props: {
            onChange: (value) => {
                modalFormInstance.value?.setFormItem('path', value.toLowerCase().replaceAll('.', '/'));
                modalFormInstance.value?.setFormItem('permission', value.toLowerCase().replaceAll('.', ':'));
            }
        }
    },
    {
        label: '菜单标题',
        name: 'title',
        gridProps: {
            colSpan: 12
        },
        rules: [
            { required: true, message: '请输入菜单标题' }
        ]
    },
    {
        label: '类型',
        name: 'type',
        type: 'select',
        data: MENU_TYPE,
        defaultValue: '1',
        gridProps: {
            colSpan: 12
        },
        rules: [
            { required: true, message: '请输入菜单标题' }
        ]
    },
    {
        label: '菜单路径',
        name: 'path',
        gridProps: {
            colSpan: 12
        },
        rules: [
            { required: true, message: '请输入菜单路径' }
        ],
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '权限标识',
        name: 'permission',
        gridProps: {
            colSpan: 12
        },
        props: {
            formProps: {
                tips: '不填写则不进行权限控制'
            }
        },
    },
    {
        label: '父级菜单',
        name: 'parentId',
        gridProps: {
            colSpan: 12
        },
    },
    {
        label: '图标',
        name: 'icon',
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '是否认证',
        name: 'auth',
        type: 'radio',
        data: YES_OR_NO,
        defaultValue: 1,
        gridProps: {
            colSpan: 12
        },
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '是否隐藏',
        name: 'hidden',
        type: 'radio',
        data: YES_OR_NO,
        defaultValue: 0,
        gridProps: {
            colSpan: 12
        },
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '是否外链',
        name: 'link',
        type: 'radio',
        data: YES_OR_NO,
        defaultValue: 0,
        gridProps: {
            colSpan: 12
        },
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '是否内嵌',
        name: 'frame',
        type: 'radio',
        data: YES_OR_NO,
        defaultValue: 0,
        gridProps: {
            colSpan: 12
        },
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '链接地址',
        name: 'href',
        hidden: (formModel) => (formModel?.type == '2' || (formModel?.link == 2 && formModel?.frame == 2))
    },
    {
        label: '排序',
        name: 'sortNum',
        type: 'inputNumber',
        defaultValue: 0,
        props: {
            inputNumberProps: {
                theme: 'normal',
                style: 'width: 100%'
            } as TdInputNumberProps,
            formProps: {
                tips: '数字越小越靠前'
            }
        } as ProFormInputNumberProps
    }
]);

const visible = ref(false);

const treeData = ref<MenuResult[]>([]);

const emits = defineEmits<{
    (e: 'finish'): void
}>();

onMounted(() => {
    getMenuWithChildren().then(res => {
        treeData.value = res;
    })
})

function handleSubmit(data: CreateMenuDTO) {
    if(!data.path.startsWith('/')) {
        data.path = '/' + data.path;
    }
    createMenu(data).then(() => {
        MessagePlugin.success('创建成功');
        visible.value = false;
        emits('finish');
    }).catch(e => {
        MessagePlugin.error(e || '创建失败');
    });
}

</script>
<template>
    <div>
        <t-button @click="visible = true">创建菜单</t-button>
        <ModalForm ref="modalFormInstance" @submit="handleSubmit" v-model:visible="visible" header="创建菜单" :width="800"
            :options="options">
            <template #form-icon="{ data }">
                <t-form-item tips="注意：复制图标时，复制图标名即可，复制组件不生效" label="图标" name="icon">
                    <t-input placeholder="请选择图标" v-model="data['icon']"></t-input>
                    <IconChoose class="ml-4" />
                </t-form-item>
            </template>

            <template #form-parentId="{ data }">
                <t-form-item label="父级菜单" name="parentId">
                    <t-tree-select :tree-props="{
                        checkStrictly: true,
                    }" v-model:value="data['parentId']" :keys="{ value: 'id', label: 'meta.title' }" :data="treeData">
                        <template #valueDisplay="{ value }"> {{ value?.meta?.title }} </template>
                    </t-tree-select>
                </t-form-item>
            </template>
        </ModalForm>
    </div>
</template>