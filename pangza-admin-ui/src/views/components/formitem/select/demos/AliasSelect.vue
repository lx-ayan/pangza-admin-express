<script setup lang="tsx">
import { reactive } from 'vue';

const formData = reactive({
    city: '',
});

/** 字段名不是默认的 label / value */
const data = [
    { label1: '北京', value1: 'bj' },
    { label1: '上海', value1: 'sh' },
    { label1: '广州', value1: 'gz' },
];
</script>

<template>
    <t-form :data="formData" label-align="top" class="max-w-md">
        <ProFormSelect
            v-model="formData.city"
            name="city"
            label="城市"
            placeholder="请选择城市"
            keyname="label1"
            valuename="value1"
            :data="data"
        />
    </t-form>
</template>
