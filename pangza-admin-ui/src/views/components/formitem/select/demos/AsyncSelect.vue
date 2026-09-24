<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({
    city: '',
});

/**
 * 模拟异步选项
 */
function loadData() {
    return new Promise<OptionData[]>((resolve) => {
        setTimeout(() => {
            resolve([
                { label: '北京', value: 'bj' },
                { label: '上海', value: 'sh' },
                { label: '广州', value: 'gz' },
            ]);
        }, 500);
    });
}
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormSelect
            v-model="formData.city"
            name="city"
            label="城市"
            placeholder="异步加载选项"
            :data="loadData"
        />
    </t-form>
</template>
