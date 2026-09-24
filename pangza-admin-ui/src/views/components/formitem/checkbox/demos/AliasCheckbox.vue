<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({
    hobbies: ['read'] as string[],
});

/** 字段名不是默认的 label / value */
const data = [
    { title: '阅读', id: 'read' },
    { title: '运动', id: 'sport' },
    { title: '音乐', id: 'music' },
];
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormCheckbox
            v-model="formData.hobbies"
            name="hobbies"
            label="兴趣爱好"
            keyname="title"
            valuename="id"
            :data="data"
        />
    </t-form>
</template>
