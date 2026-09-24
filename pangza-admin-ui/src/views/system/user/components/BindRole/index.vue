<script setup lang='ts'>
import { bindUserRole, getUserRole } from '@/api/user';
import { getRoleList } from '@/api/role';
import type { SelectCardOption } from '@/components/public/SelectCardGroup/types';
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';
import { ref } from 'vue';

const props = defineProps<{
    /** 当前用户 id */
    userId: string;
}>();

const roleOptions = ref<SelectCardOption[]>([]);
const roleIds = ref<string[]>([]);

/**
 * 弹窗打开时加载角色列表及用户已绑定角色
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
        return getUserRole(props.userId);
    }).then((res) => {
        roleIds.value = res || [];
    });
}

/**
 * 确认绑定角色
 */
function handleConfirm(instance: DialogInstance) {
    bindUserRole({
        userId: props.userId,
        roleIds: roleIds.value,
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
        header="绑定角色"
        :dialog-props="{ width: '640px' }"
        @visible-change="handleVisibleChange"
        @confirm="handleConfirm"
    >
        绑定角色
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
