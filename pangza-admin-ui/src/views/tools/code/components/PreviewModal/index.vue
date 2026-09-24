<script setup lang="ts">
import CodeEditor from '@/components/business/CodeEditor/index.vue';
import useCopy from '@/hooks/core/useCopy';
import useThemeStore from '@/store/themeStore';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';
import type { CodeGenModel } from '../../types';
import { generateCodeFiles } from '../../utils/generateCodeFiles';
import { downloadCodeZip } from '../../utils/downloadCodeZip';
import { syncCodeGenModel } from '../../utils/configMapper';

const props = defineProps<{
    model: CodeGenModel | null;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const activeFile = ref('domain');
const themeStore = useThemeStore();

const editorTheme = computed(() => themeStore.isDarkMode ? 'vs-dark' : 'vs');

const codeFiles = computed(() => {
    if (!props.model) {
        return [];
    }
    return generateCodeFiles(syncCodeGenModel(props.model));
});

const currentFile = computed(() => codeFiles.value.find((item) => item.key === activeFile.value));

watch(visible, (value) => {
    if (value && codeFiles.value.length) {
        activeFile.value = codeFiles.value[0].key;
    }
});

/** 复制当前代码 */
function handleCopy() {
    if (!currentFile.value?.code) {
        return;
    }
    useCopy(currentFile.value.code).then(() => {
        MessagePlugin.success('复制成功');
    });
}

/** 下载 zip */
async function handleDownload() {
    if (!props.model) {
        return;
    }
    const model = syncCodeGenModel(props.model);
    await downloadCodeZip(model, codeFiles.value);
    MessagePlugin.success('代码已下载');
}
</script>

<template>
    <t-dialog
        v-model:visible="visible"
        header="代码预览"
        width="960px"
        :footer="false"
        destroy-on-close
        class="code-preview-modal"
    >
        <div v-if="codeFiles.length" class="code-preview-modal__body">
            <t-tabs v-model="activeFile" class="code-preview-modal__tabs">
                <t-tab-panel
                    v-for="file in codeFiles"
                    :key="file.key"
                    :value="file.key"
                    :label="file.label"
                />
            </t-tabs>

            <div class="code-preview-modal__toolbar">
                <t-space>
                    <t-button size="small" variant="outline" @click="handleCopy">
                        <MyIcon name="Copy" :size="14" />
                        复制
                    </t-button>
                    <t-button size="small" theme="primary" @click="handleDownload">
                        <MyIcon name="Download" :size="14" />
                        下载 zip
                    </t-button>
                </t-space>
            </div>

            <CodeEditor
                v-if="currentFile"
                :model-value="currentFile.code"
                :language="currentFile.language"
                :theme="editorTheme"
                read-only
                height="520px"
            />
        </div>

        <t-empty v-else description="暂无预览内容" />
    </t-dialog>
</template>

<style scoped lang="scss">
.code-preview-modal__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.code-preview-modal__toolbar {
    display: flex;
    justify-content: flex-end;
}
</style>
