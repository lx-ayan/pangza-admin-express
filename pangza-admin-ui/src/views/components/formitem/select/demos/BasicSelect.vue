<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({
    status: '',
});

const data = [
    { label: '启用', value: '1' },
    { label: '禁用', value: '2' },
    { label: '待审核', value: '3', disabled: true },
];
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormSelect
            v-model="formData.status"
            name="status"
            label="状态"
            placeholder="请选择状态"
            :data="data"
        />
    </t-form>
</template>
