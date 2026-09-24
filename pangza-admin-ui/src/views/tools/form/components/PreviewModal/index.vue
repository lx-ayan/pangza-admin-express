<script setup lang="ts">
import CodeEditor from '@/components/business/CodeEditor/index.vue';
import useCopy from '@/hooks/core/useCopy';
import useThemeStore from '@/store/themeStore';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed } from 'vue';

const props = defineProps<{
    code: string;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const themeStore = useThemeStore();

const editorTheme = computed(() => themeStore.isDarkMode ? 'vs-dark' : 'vs');

/** 复制代码 */
function handleCopy() {
    if (!props.code) {
        return;
    }
    useCopy(props.code).then(() => {
        MessagePlugin.success('复制成功');
    });
}
</script>

<template>
    <t-dialog
        v-model:visible="visible"
        header="代码预览"
        width="960px"
        :footer="false"
        destroy-on-close
        class="form-preview-modal"
    >
        <div v-if="code" class="form-preview-modal__body">
            <div class="form-preview-modal__toolbar">
                <t-button size="small" variant="outline" @click="handleCopy">
                    <MyIcon name="Copy" :size="14" />
                    复制
                </t-button>
            </div>

            <CodeEditor
                :model-value="code"
                language="typescript"
                :theme="editorTheme"
                read-only
                height="520px"
            />
        </div>

        <t-empty v-else description="暂无预览内容" />
    </t-dialog>
</template>

<style scoped lang="scss">
.form-preview-modal__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.form-preview-modal__toolbar {
    display: flex;
    justify-content: flex-end;
}
</style>
