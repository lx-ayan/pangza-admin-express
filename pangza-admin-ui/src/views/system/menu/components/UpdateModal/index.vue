<script setup lang='ts'>
import { ModalForm, type ModalFormInstance, type ProFormOption } from '@/components/ProComponents';
import IconChoose from '@/components/business/IconChoose/index.vue';
import { onMounted, ref, useTemplateRef } from 'vue';
import { formOptions } from '../options';
import type { CreateMenuDTO, MenuResult } from '@/types/api/menu';
import { updateMenu, getMenu, getMenuWithChildren } from '@/api/menu';
import { MessagePlugin } from 'tdesign-vue-next';
const options = ref<ProFormOption[]>(formOptions);

const visible = ref(false);

const treeData = ref<MenuResult[]>([]);

const modalFormRef = useTemplateRef<ModalFormInstance>('modalFormRef');

const props = defineProps<{
    id: string
}>();

const emits = defineEmits<{
    (e: 'finish'): void
}>();

onMounted(() => {
    getMenuWithChildren().then(res => {
        treeData.value = [
            {
                id: '-1',
                meta: {
                    title: '顶级菜单'
                },
                children: res
            }
        ] as unknown as MenuResult[];
    })
})

let request = async () => {
    const result = await getMenu(props.id);

    return {
        ...result,
        parentId: result.parentId?.toString() || '-1'
    };
};

function handleSubmit(data: CreateMenuDTO) {
    updateMenu({ id: props.id, ...data }).then(() => {
        visible.value = false;
        MessagePlugin.success('修改成功');
        emits('finish');
    }).catch(e => {
        MessagePlugin.error(e || '创建失败');
    });
}

defineExpose({
    open: () => {
        visible.value = true;
    },
    close: () => {
        visible.value = false;
    }
})

</script>
<template>
    <ModalForm :stop-request="true" :request="request" ref="modalFormRef" @submit="handleSubmit"
        v-model:visible="visible" header="修改菜单" :width="800" :options="options">
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
</template>