<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({
    perms: [] as string[],
});

/**
 * 模拟异步选项
 */
function loadData() {
    return new Promise<OptionData[]>((resolve) => {
        setTimeout(() => {
            resolve([
                { label: '查看', value: 'read' },
                { label: '编辑', value: 'write' },
                { label: '删除', value: 'delete' },
            ]);
        }, 500);
    });
}
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormCheckbox
            v-model="formData.perms"
            name="perms"
            label="权限"
            :data="loadData"
        />
    </t-form>
</template>
