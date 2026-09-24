<script setup lang="tsx">
import { MessagePlugin } from 'tdesign-vue-next';
import { reactive } from 'vue';

const formData = reactive({
    status: '',
});

const data = [
    { label: '启用', value: '1' },
    { label: '禁用', value: '2' },
];

/**
 * 校验通过后提交
 */
function handleSubmit({ validateResult }: { validateResult: boolean }) {
    if (validateResult === true) {
        MessagePlugin.success(`当前值：${formData.status}`);
    }
}
</script>

<template>
    <t-form
        :data="formData"
        label-align="top"
        class="max-w-md"
        @submit="handleSubmit"
    >
        <ProFormRadio
            v-model="formData.status"
            name="status"
            label="状态"
            :data="data"
            :rules="[{ required: true, message: '请选择状态' }]"
        />
        <t-form-item>
            <t-button theme="primary" type="submit">提交</t-button>
        </t-form-item>
    </t-form>
</template>
