<script setup lang="ts">
import ThemeConfigPanel from '../ThemeConfigPanel/index.vue';
import ThemePreviewPanel from '../ThemePreviewPanel/index.vue';

const visible = defineModel<boolean>('visible', { default: false });
</script>

<template>
    <t-dialog
        v-model:visible="visible"
        :header="false"
        :footer="false"
        :close-btn="false"
        :close-on-overlay-click="true"
        width="960px"
        placement="center"
        attach="body"
        class="theme-config-modal"
    >
        <div class="theme-config-modal__body">
            <ThemeConfigPanel @close="visible = false" />
            <ThemePreviewPanel />
        </div>
    </t-dialog>
</template>

<style lang="scss">
.theme-config-modal {
    .t-dialog {
        padding: 0;
        overflow: hidden;
        border-radius: 14px;
    }

    .t-dialog__body {
        padding: 0;
    }
}

.theme-config-modal__body {
    display: flex;
    height: 620px;
    overflow: hidden;
    padding: 0 8px;
    background: var(--td-bg-color-container);
}
</style>
