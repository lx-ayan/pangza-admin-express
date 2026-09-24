<script setup lang='ts'>
const hideForm = defineModel('modelValue', {
    default: true
});
</script>
<template>
    <t-button :theme="!hideForm ? 'primary' : 'base'" @click="hideForm = !hideForm">
        <template #icon>
            <MyIcon size="16px" name="Search" />
        </template>
    </t-button>
</template>