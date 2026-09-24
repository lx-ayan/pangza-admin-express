<script setup lang="ts">
import useThemeStore from '@/store/themeStore';
import { getThemeSkinStyleVars } from '@/utils/core/css';
import { computed } from 'vue';

const themeStore = useThemeStore();

/** 预览区跟随当前系统主题 */
const previewThemeMode = computed(() => themeStore.theme);

const isPreviewDark = computed(() => previewThemeMode.value === 'dark');

/** 预览区局部主题变量，与当前皮肤配置保持一致 */
const previewCanvasStyle = computed(() => {
    const colors = themeStore.skin === 'custom'
        ? { ...themeStore.customSkin.colors }
        : {
            brand: themeStore.brandColor,
            success: themeStore.successColor,
            warning: themeStore.warningColor,
            error: themeStore.errorColor,
        };

    return getThemeSkinStyleVars(themeStore.skin, colors, previewThemeMode.value, {
        customSkin: themeStore.skin === 'custom' ? themeStore.customSkin : undefined,
        radiusPreset: themeStore.radiusPreset,
        sizePreset: themeStore.sizePreset,
        enableShadow: themeStore.enableShadow,
        enableBorder: themeStore.enableBorder,
    });
});

const tableColumns = [
    { colKey: 'name', title: '名称', width: 140 },
    { colKey: 'type', title: '类型', width: 100 },
    { colKey: 'status', title: '状态', width: 100 },
    { colKey: 'owner', title: '负责人', width: 100 },
];

const tableData = [
    { id: 1, name: '示例数据 A', type: '类型一', status: 'success', owner: '张三' },
    { id: 2, name: '示例数据 B', type: '类型二', status: 'warning', owner: '李四' },
    { id: 3, name: '示例数据 C', type: '类型三', status: 'danger', owner: '王五' },
];

const formSkeletonCol = [
    { width: '100%', height: '32px' },
];

function handleThemeChange(mode: false | true | 'window') {
    themeStore.setDark(mode);
}

function getStatusTheme(status: string) {
    if (status === 'success') {
        return 'success';
    }
    if (status === 'warning') {
        return 'warning';
    }
    return 'danger';
}

function getStatusLabel(status: string) {
    if (status === 'success') {
        return '成功';
    }
    if (status === 'warning') {
        return '警告';
    }
    return '错误';
}
</script>

<template>
    <div class="theme-preview-panel">
        <div class="theme-preview-panel__header">
            <span>配置效果预览</span>
            <div class="theme-preview-panel__modes">
                <button
                    type="button"
                    class="theme-preview-panel__mode"
                    :class="{ 'theme-preview-panel__mode--active': themeStore.isDark === false }"
                    @click="handleThemeChange(false)"
                >
                    浅色
                </button>
                <button
                    type="button"
                    class="theme-preview-panel__mode"
                    :class="{ 'theme-preview-panel__mode--active': themeStore.isDark === true }"
                    @click="handleThemeChange(true)"
                >
                    暗色
                </button>
                <button
                    type="button"
                    class="theme-preview-panel__mode"
                    :class="{ 'theme-preview-panel__mode--active': themeStore.isDark === 'window' }"
                    @click="handleThemeChange('window')"
                >
                    系统
                </button>
            </div>
        </div>

        <div
            class="theme-preview-panel__canvas"
            :theme-mode="isPreviewDark ? 'dark' : 'light'"
            :style="previewCanvasStyle"
            :class="{
                'theme-preview-panel__canvas--shadow': themeStore.enableShadow,
                'theme-preview-panel__canvas--borderless': !themeStore.enableBorder,
            }"
        >
            <div :key="previewThemeMode" class="pro-table-preview">
                <t-card :bordered="false" class="pro-table-preview__form">
                    <div class="pro-table-preview__form-row">
                        <div class="pro-table-preview__form-fields">
                            <div v-for="index in 2" :key="index" class="pro-table-preview__form-item">
                                <t-skeleton :row-col="formSkeletonCol" animation="gradient" />
                            </div>
                        </div>
                        <div class="pro-table-preview__form-actions">
                            <t-button theme="primary">查询</t-button>
                            <t-button variant="outline">重置</t-button>
                        </div>
                    </div>
                </t-card>

                <t-card :bordered="false" class="pro-table-preview__body">
                    <template #title>
                        <span class="pro-table-preview__title">数据列表</span>
                    </template>
                    <template #actions>
                        <t-space :size="8">
                            <t-button theme="primary" size="small">新增</t-button>
                            <t-button variant="outline" size="small">导出</t-button>
                        </t-space>
                    </template>

                    <t-table
                        row-key="id"
                        :columns="tableColumns"
                        :data="tableData"
                        size="small"
                        :bordered="themeStore.enableBorder"
                    >
                        <template #status="{ row }">
                            <t-tag :theme="getStatusTheme(row.status)" variant="light">
                                {{ getStatusLabel(row.status) }}
                            </t-tag>
                        </template>
                    </t-table>

                    <div class="pro-table-preview__pagination">
                        <t-pagination
                            :total="48"
                            :page-size="10"
                            :current="1"
                            size="small"
                            show-jumper
                        />
                    </div>
                </t-card>

                <t-space class="mt-6">
                    <t-button theme="default">默认按钮</t-button>
                    <t-button theme="primary">主要按钮</t-button>
                    <t-button theme="success">成功按钮</t-button>
                    <t-button theme="danger">危险按钮</t-button>
                    <t-button theme="warning">警告按钮</t-button>
                </t-space>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.theme-preview-panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    padding: 0 16px 16px 0;
}

.theme-preview-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 8px 12px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
}

.theme-preview-panel__modes {
    display: flex;
    gap: 4px;
    padding: 3px;
    border-radius: var(--td-radius-medium);
    background: var(--td-bg-color-secondarycontainer);
}

.theme-preview-panel__mode {
    min-width: 52px;
    height: 28px;
    padding: 0 10px;
    border: none;
    border-radius: var(--td-radius-default);
    background: transparent;
    color: var(--td-text-color-secondary);
    font-size: 12px;
    cursor: pointer;

    &--active {
        background: var(--td-brand-color);
        color: #fff;
    }
}

.theme-preview-panel__canvas {
    flex: 1;
    overflow: auto;
    padding: 0 8px 8px 16px;
    color: var(--td-text-color-primary);
}

.theme-preview-panel__canvas--borderless :deep(.t-card),
.theme-preview-panel__canvas--borderless :deep(.t-table) {
    border-color: transparent;
}

.theme-preview-panel__canvas--shadow :deep(.t-card) {
    box-shadow: var(--td-shadow-1);
}

.pro-table-preview {
    min-height: 100%;
    padding-top: 24px;
}

.pro-table-preview__form {
    margin-bottom: 16px;
    background: var(--td-bg-color-container);

    :deep(.t-card__body) {
        display: flex;
        align-items: center;
    }
}

.pro-table-preview__form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    width: 100%;
}

.pro-table-preview__form-fields {
    display: flex;
    flex: 1;
    gap: 16px;
    min-width: 0;
}

.pro-table-preview__form-item {
    flex: 1;
    min-width: 0;
}

.pro-table-preview__form-actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
}

.pro-table-preview__body {
    background: var(--td-bg-color-container);
}

.pro-table-preview__title {
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
}

.pro-table-preview__pagination {
    margin-top: 24px;
}
</style>
