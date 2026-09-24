<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({
    tags: [] as string[],
});

const data = [
    { label: 'Vue', value: 'vue' },
    { label: 'React', value: 'react' },
    { label: 'Angular', value: 'angular' },
];
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormSelect
            v-model="formData.tags"
            name="tags"
            label="技术栈"
            placeholder="可多选"
            :data="data"
            :select-props="{ multiple: true, clearable: true }"
        />
    </t-form>
</template>
