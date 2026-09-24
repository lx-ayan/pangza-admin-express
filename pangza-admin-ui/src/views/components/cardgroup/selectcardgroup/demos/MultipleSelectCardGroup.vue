<script setup lang="ts">
import { ref } from 'vue';
import type { SelectCardOption } from '@/components/public/SelectCardGroup/types';

/** 多选选项 */
const options: SelectCardOption[] = [
    { value: '1', label: '系统管理', description: '用户 / 角色 / 菜单' },
    { value: '2', label: '日志审计', description: '操作日志与登录日志' },
    { value: '3', label: '个人中心', description: '资料与安全设置' },
    { value: '4', label: '组件示例', description: '文档演示页面' },
];

const roleIds = ref<Array<string | number>>(['1', '2']);
</script>

<template>
    <SelectCardGroup
        v-model="roleIds"
        :options="options"
        multiple
        :columns="2"
        empty-text="暂无可选项"
    />
</template>
