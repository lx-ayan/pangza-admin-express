<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({
    gender: '',
});

/**
 * 模拟异步选项
 */
function loadData() {
    return new Promise<OptionData[]>((resolve) => {
        setTimeout(() => {
            resolve([
                { label: '男', value: 'male' },
                { label: '女', value: 'female' },
            ]);
        }, 500);
    });
}
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormRadio
            v-model="formData.gender"
            name="gender"
            label="性别"
            :data="loadData"
        />
    </t-form>
</template>
