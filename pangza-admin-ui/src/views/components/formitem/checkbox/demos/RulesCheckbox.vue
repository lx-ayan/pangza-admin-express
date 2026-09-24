<script setup lang="tsx">
import { MessagePlugin } from 'tdesign-vue-next';
import { reactive } from 'vue';

const formData = reactive({
    hobbies: [] as string[],
});

const data = [
    { label: '阅读', value: 'read' },
    { label: '运动', value: 'sport' },
    { label: '音乐', value: 'music' },
];

/**
 * 校验通过后提交
 */
function handleSubmit({ validateResult }: { validateResult: boolean }) {
    if (validateResult === true) {
        MessagePlugin.success(`已选：${JSON.stringify(formData.hobbies)}`);
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
        <ProFormCheckbox
            v-model="formData.hobbies"
            name="hobbies"
            label="兴趣爱好"
            :data="data"
            :rules="[{ required: true, message: '请至少选择一项' }]"
        />
        <t-form-item>
            <t-button theme="primary" type="submit">提交</t-button>
        </t-form-item>
    </t-form>
</template>
