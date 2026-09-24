<script setup lang="ts">
import FormDesignerPage from '../tools/form/index.vue';
</script>

<template>
    <div class="form-page">
        <FormDesignerPage />
    </div>
</template>

<style scoped lang="scss">
.form-page {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
}
</style>
