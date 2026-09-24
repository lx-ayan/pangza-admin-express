<script setup lang="ts">
import { ref } from 'vue';
import type { SelectCardOption } from '@/components/public/SelectCardGroup/types';

/** 单选选项 */
const options: SelectCardOption[] = [
    { value: 'admin', label: '管理员', description: '拥有系统全部权限' },
    { value: 'editor', label: '编辑', description: '可编辑业务内容' },
    { value: 'viewer', label: '访客', description: '仅可查看', disabled: true },
];

const role = ref<string | number | undefined>('admin');
</script>

<template>
    <SelectCardGroup v-model="role" :options="options" :columns="3" />
</template>
