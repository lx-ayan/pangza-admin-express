<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({
    status: '1',
});

/** 字段名不是默认的 label / value */
const data = [
    { name: '启用', code: '1' },
    { name: '禁用', code: '2' },
];
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormRadio
            v-model="formData.status"
            name="status"
            label="状态"
            keyname="name"
            valuename="code"
            :data="data"
        />
    </t-form>
</template>
