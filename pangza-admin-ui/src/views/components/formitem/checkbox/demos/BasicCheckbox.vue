<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({
    hobbies: ['read'] as string[],
});

const data = [
    { label: '阅读', value: 'read' },
    { label: '运动', value: 'sport' },
    { label: '音乐', value: 'music' },
    { label: '旅行', value: 'travel', disabled: true },
];
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormCheckbox
            v-model="formData.hobbies"
            name="hobbies"
            label="兴趣爱好"
            :data="data"
        />
    </t-form>
</template>
