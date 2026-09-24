<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({
    role: '',
});

const data = [
    { label: '管理员', value: 'admin' },
    { label: '编辑', value: 'editor' },
    { label: '访客', value: 'guest' },
];
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormSelect
            v-model="formData.role"
            filled
            name="role"
            label="角色"
            placeholder="填充风格"
            :data="data"
        />
    </t-form>
</template>
