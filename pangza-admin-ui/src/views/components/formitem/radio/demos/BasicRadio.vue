<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({
    status: '1',
});

const data = [
    { label: '启用', value: '1' },
    { label: '禁用', value: '2' },
    { label: '待审核', value: '3', disabled: true },
];
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormRadio
            v-model="formData.status"
            name="status"
            label="状态"
            :data="data"
        />
    </t-form>
</template>
