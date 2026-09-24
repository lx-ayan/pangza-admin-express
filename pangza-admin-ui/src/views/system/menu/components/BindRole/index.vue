<script setup lang='ts'>
import { bindMenuRole, getMenuRoleIds } from '@/api/menu';
import { getRoleList } from '@/api/role';
import type { SelectCardOption } from '@/components/public/SelectCardGroup/types';
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';
import { computed, ref } from 'vue';

const props = defineProps<{
    /** 当前菜单 id */
    menuId: string;
    /** 菜单标题，用于弹窗展示 */
    menuTitle?: string;
}>();

const roleOptions = ref<SelectCardOption[]>([]);
const roleIds = ref<string[]>([]);

/** 弹窗标题：绑定权限 - 菜单名 */
const dialogHeader = computed(() => {
    return props.menuTitle ? `绑定权限 - ${props.menuTitle}` : '绑定权限';
});

/**
 * 弹窗打开时：加载全部角色，并回填当前菜单已绑定的角色
 */
function handleVisibleChange(visible: boolean) {
    if (!visible) {
        return;
    }
    getRoleList().then((res) => {
        roleOptions.value = (res || []).map((item) => ({
            value: item.id,
            label: item.nameZh,
            description: item.description || item.name || '暂无描述',
        }));
        return getMenuRoleIds(props.menuId);
    }).then((res) => {
        roleIds.value = res || [];
    });
}

/**
 * 确认绑定：后端会先删除该菜单原有 menu_role，再写入新关联
 */
function handleConfirm(instance: DialogInstance) {
    bindMenuRole({
        menuId: props.menuId,
        roleIds: roleIds.value as string[],
    }).then(() => {
        instance.destroy();
        MessagePlugin.success('绑定成功');
    });
}

</script>

<template>
    <DialogLink
        theme="primary"
        hover="color"
        :header="dialogHeader"
        :dialog-props="{ width: '640px' }"
        @visible-change="handleVisibleChange"
        @confirm="handleConfirm"
    >
        绑定权限
        <template #content>
            <SelectCardGroup
                v-model="roleIds"
                :options="roleOptions"
                multiple
                :columns="2"
                empty-text="暂无可绑定角色"
            />
        </template>
    </DialogLink>
</template>
