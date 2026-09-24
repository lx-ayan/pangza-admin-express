<script setup lang="ts">
import { computed, ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import { MdPreview } from 'md-editor-v3';

const props = withDefaults(defineProps<{
    /** 锚点 id，用于目录跳转 */
    id?: string;
    /** 示例标题 */
    title: string;
    /** 简短说明 */
    description?: string;
    /** 补充说明 */
    detail?: string;
    /** TypeScript 源码 */
    code: string;
    /** 默认是否展开代码 */
    defaultExpanded?: boolean;
    /** 预览区使用无边框卡片包裹（适合表单等） */
    borderlessCard?: boolean;
}>(), {
    id: '',
    description: '',
    detail: '',
    defaultExpanded: true,
    borderlessCard: false,
});

defineOptions({
    name: 'DemoBlock',
    globalComponent: true,
});

const showCode = ref(props.defaultExpanded);

const mdCode = computed(() => `\`\`\`tsx\n${props.code.trim()}\n\`\`\``);

/**
 * 复制 TypeScript 示例代码
 */
async function handleCopy() {
    try {
        await navigator.clipboard.writeText(props.code.trim());
        MessagePlugin.success('代码已复制');
    } catch {
        MessagePlugin.error('复制失败');
    }
}
</script>

<template>
    <div :id="id || undefined" class="demo-block">
        <div class="demo-block__header">
            <h3 class="demo-block__title">{{ title }}</h3>
            <p v-if="description" class="demo-block__desc">{{ description }}</p>
            <p v-if="detail" class="demo-block__detail">{{ detail }}</p>
        </div>

        <!-- 表格预览默认不包卡片；表单等可通过 borderlessCard 启用无边框卡片 -->
        <div class="demo-block__preview">
            <t-card v-if="borderlessCard" :bordered="false" class="demo-block__preview-card">
                <slot />
            </t-card>
            <slot v-else />
        </div>

        <div class="demo-block__code-wrap">
            <div class="demo-block__toolbar">
                <div class="demo-block__tabs">
                    <span class="demo-block__tab is-active">TypeScript</span>
                </div>
                <t-space :size="4">
                    <t-tooltip content="复制代码">
                        <t-button variant="text" shape="square" @click="handleCopy">
                            <template #icon>
                                <MyIcon name="Copy" :size="16" />
                            </template>
                        </t-button>
                    </t-tooltip>
                    <t-tooltip :content="showCode ? '收起代码' : '展开代码'">
                        <t-button variant="text" shape="square" @click="showCode = !showCode">
                            <template #icon>
                                <MyIcon name="CodeXml" :size="16" />
                            </template>
                        </t-button>
                    </t-tooltip>
                </t-space>
            </div>

            <div v-show="showCode" class="demo-block__code-body">
                <MdPreview :model-value="mdCode" preview-theme="github" code-theme="github" />
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.demo-block {
    margin-bottom: 48px;
    scroll-margin-top: 80px;
}

.demo-block__header {
    margin-bottom: 16px;
}

.demo-block__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--td-text-color-primary);
}

.demo-block__desc {
    margin: 8px 0 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--td-text-color-primary);
}

.demo-block__detail {
    margin: 4px 0 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--td-text-color-secondary);
}

.demo-block__preview {
    margin-bottom: 12px;
}

.demo-block__preview-card {
    background: var(--td-bg-color-container);
}

.demo-block__code-wrap {
    position: relative;
    z-index: 0;
    isolation: isolate;
    overflow: hidden;
    border: 1px solid var(--td-component-border);
    border-radius: 8px;
    background: var(--td-bg-color-container);
}

.demo-block__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px 0 20px;
    border-bottom: 1px solid var(--td-component-border);
}

.demo-block__tabs {
    display: flex;
    gap: 24px;
}

.demo-block__tab {
    position: relative;
    padding: 12px 0;
    font-size: 14px;
    color: var(--td-text-color-secondary);
    cursor: default;

    &.is-active {
        color: var(--td-brand-color);
        font-weight: 500;

        &::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            height: 2px;
            background: var(--td-brand-color);
        }
    }
}

.demo-block__code-body {
    padding: 8px 12px 16px;
    background: var(--td-bg-color-secondarycontainer);

    :deep(.md-editor-preview-wrapper) {
        padding: 0;
    }

    :deep(.md-editor) {
        background: transparent;
    }

  /** md-editor 代码头默认 z-index: 10000，需低于抽屉遮罩（1500） */
    :deep(.md-editor-code .md-editor-code-head) {
        z-index: 1;
    }

    :deep(pre) {
        margin: 0;
    }
}
</style>
