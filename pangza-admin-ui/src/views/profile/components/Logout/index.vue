<script setup lang='ts'>
import { DialogButton } from '@/components/ProComponents';
import useUserStore from '@/store/userStore';
import type { DialogInstance } from 'tdesign-vue-next';

const userStore = useUserStore();

/**
 * 确认退出登录
 */
function handleConfirm(instance: DialogInstance) {
    userStore.logout().finally(() => {
        instance.destroy();
    });
}

</script>
<template>
    <div class="mt-10">
        <t-card :bordered="false">
            <div class="flex items-center justify-between">
                <div class="flex items-center text-[var(--td-text-color-secondary)]">
                    <MyIcon size="16" class="mr-2" name="LogOut" />
                    退出后需要重新登录才能访问系统
                </div>
                <div>
                    <DialogButton
                        theme="danger"
                        header="系统提示"
                        content="确认退出登录吗？"
                        @confirm="handleConfirm"
                    >
                        退出登录
                    </DialogButton>
                </div>
            </div>
        </t-card>
    </div>
</template>
