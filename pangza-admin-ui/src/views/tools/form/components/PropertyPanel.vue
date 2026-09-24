<script setup lang="ts">
import { computed } from 'vue';
import {
    BUTTON_THEME_OPTIONS,
    COMPONENT_TYPE_OPTIONS,
    FORM_SIZE_OPTIONS,
    LABEL_ALIGN_OPTIONS,
} from '../constants';
import type { FormComponentType, FormDesignerConfig, FormDesignerItem } from '../types';
import { changeFormItemType } from '../utils/createFormItem';

const props = defineProps<{
    activeItem: FormDesignerItem | null;
    formConfig: FormDesignerConfig;
}>();

const emit = defineEmits<{
    'update:formConfig': [config: FormDesignerConfig];
}>();

const activeTab = defineModel<string>('activeTab', { default: 'component' });

const showOptionsEditor = computed(() => {
    return props.activeItem && ['select', 'radio', 'checkbox'].includes(props.activeItem.type);
});

const showNumberConfig = computed(() => {
    return props.activeItem && ['inputNumber', 'slider', 'rate'].includes(props.activeItem.type);
});

const showInputConfig = computed(() => {
    return props.activeItem && ['input', 'textarea', 'password'].includes(props.activeItem.type);
});

/** 更新表单配置 */
function updateFormConfig<K extends keyof FormDesignerConfig>(key: K, value: FormDesignerConfig[K]) {
    emit('update:formConfig', {
        ...props.formConfig,
        [key]: value,
    });
}

/** 切换组件类型 */
function handleTypeChange(type: FormComponentType) {
    if (!props.activeItem || props.activeItem.type === type) {
        return;
    }
    const next = changeFormItemType(props.activeItem, type);
    const staleKeys = Object.keys(props.activeItem) as (keyof FormDesignerItem)[];
    staleKeys.forEach((key) => {
        Reflect.deleteProperty(props.activeItem as object, key);
    });
    Object.assign(props.activeItem, next);
}

/** 添加选项 */
function handleAddOption() {
    if (!props.activeItem?.options) {
        return;
    }
    props.activeItem.options.push({
        label: `选项${props.activeItem.options.length + 1}`,
        value: String(props.activeItem.options.length + 1),
    });
}

/** 删除选项 */
function handleRemoveOption(index: number) {
    props.activeItem?.options?.splice(index, 1);
}
</script>

<template>
    <div class="property-panel">
        <t-tabs v-model="activeTab" class="property-panel__tabs">
            <t-tab-panel value="component" label="组件属性">
                <div v-if="activeItem" :key="`${activeItem.id}-${activeItem.type}`" class="property-panel__content">
                    <div class="property-panel__field">
                        <div class="property-panel__label">组件类型</div>
                        <t-select
                            :model-value="activeItem.type"
                            :options="COMPONENT_TYPE_OPTIONS"
                            @change="handleTypeChange"
                        />
                    </div>
                    <div class="property-panel__field">
                        <div class="property-panel__label">字段名</div>
                        <t-input v-model="activeItem.field" placeholder="请输入字段名" />
                    </div>
                    <div v-if="activeItem.type !== 'button'" class="property-panel__field">
                        <div class="property-panel__label">标题</div>
                        <t-input v-model="activeItem.label" placeholder="请输入标题" />
                    </div>
                    <div v-if="activeItem.placeholder !== undefined" class="property-panel__field">
                        <div class="property-panel__label">占位提示</div>
                        <t-input v-model="activeItem.placeholder" placeholder="请输入占位提示" />
                    </div>
                    <div class="property-panel__field">
                        <div class="property-panel__label">表单栅格</div>
                        <t-slider v-model="activeItem.span" :min="1" :max="24" :step="1" />
                    </div>
                    <div class="property-panel__field">
                        <div class="property-panel__label">组件宽度</div>
                        <t-input v-model="activeItem.width" placeholder="如 100%" />
                    </div>

                    <template v-if="showInputConfig">
                        <div class="property-panel__field">
                            <div class="property-panel__label">最多输入</div>
                            <t-input-number v-model="activeItem.maxLength" :min="1" theme="column" />
                        </div>
                    </template>

                    <template v-if="showNumberConfig">
                        <div class="property-panel__field">
                            <div class="property-panel__label">最小值</div>
                            <t-input-number v-model="activeItem.min" theme="column" />
                        </div>
                        <div class="property-panel__field">
                            <div class="property-panel__label">最大值</div>
                            <t-input-number v-model="activeItem.max" theme="column" />
                        </div>
                        <div v-if="activeItem.type !== 'rate'" class="property-panel__field">
                            <div class="property-panel__label">步长</div>
                            <t-input-number v-model="activeItem.step" :min="1" theme="column" />
                        </div>
                    </template>

                    <template v-if="activeItem.type === 'button'">
                        <div class="property-panel__field">
                            <div class="property-panel__label">按钮文字</div>
                            <t-input v-model="activeItem.buttonText" />
                        </div>
                        <div class="property-panel__field">
                            <div class="property-panel__label">按钮类型</div>
                            <t-select v-model="activeItem.buttonTheme" :options="BUTTON_THEME_OPTIONS" />
                        </div>
                    </template>

                    <template v-if="showOptionsEditor && activeItem.options">
                        <div class="property-panel__field property-panel__field--full">
                            <div class="property-panel__label">选项配置</div>
                            <div class="property-panel__options">
                                <div
                                    v-for="(option, index) in activeItem.options"
                                    :key="index"
                                    class="property-panel__option-row"
                                >
                                    <t-input v-model="option.label" placeholder="标签" />
                                    <t-input v-model="option.value" placeholder="值" />
                                    <t-button
                                        size="small"
                                        variant="text"
                                        theme="danger"
                                        shape="square"
                                        @click="handleRemoveOption(index)"
                                    >
                                        <MyIcon name="Delete" :size="14" />
                                    </t-button>
                                </div>
                                <t-button size="small" variant="dashed" block @click="handleAddOption">
                                    添加选项
                                </t-button>
                            </div>
                        </div>
                    </template>

                    <div class="property-panel__switches">
                        <t-checkbox v-if="showInputConfig" v-model="activeItem.showLimitNumber">输入统计</t-checkbox>
                        <t-checkbox v-if="activeItem.clearable !== undefined" v-model="activeItem.clearable">能否清空</t-checkbox>
                        <t-checkbox v-model="activeItem.readonly">是否只读</t-checkbox>
                        <t-checkbox v-model="activeItem.disabled">是否禁用</t-checkbox>
                        <t-checkbox v-if="activeItem.type !== 'button' && activeItem.type !== 'row'" v-model="activeItem.required">
                            是否必填
                        </t-checkbox>
                    </div>
                </div>
                <t-empty v-else description="请选择组件" />
            </t-tab-panel>

            <t-tab-panel value="form" label="表单属性">
                <div class="property-panel__content">
                    <div class="property-panel__field">
                        <div class="property-panel__label">标签宽度</div>
                        <t-input-number
                            :model-value="Number(formConfig.labelWidth)"
                            :min="60"
                            :max="300"
                            theme="column"
                            @change="(v: number) => updateFormConfig('labelWidth', v)"
                        />
                    </div>
                    <div class="property-panel__field">
                        <div class="property-panel__label">标签对齐</div>
                        <t-select
                            :model-value="formConfig.labelAlign"
                            :options="LABEL_ALIGN_OPTIONS"
                            @change="(v: FormDesignerConfig['labelAlign']) => updateFormConfig('labelAlign', v)"
                        />
                    </div>
                    <div class="property-panel__field">
                        <div class="property-panel__label">表单尺寸</div>
                        <t-select
                            :model-value="formConfig.size"
                            :options="FORM_SIZE_OPTIONS"
                            @change="(v: FormDesignerConfig['size']) => updateFormConfig('size', v)"
                        />
                    </div>
                    <div class="property-panel__switches">
                        <t-checkbox
                            :checked="formConfig.colon"
                            @change="(v: boolean) => updateFormConfig('colon', v)"
                        >
                            显示冒号
                        </t-checkbox>
                    </div>
                </div>
            </t-tab-panel>
        </t-tabs>
    </div>
</template>

<style scoped lang="scss">
.property-panel {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
    background: var(--td-bg-color-container);
    border-left: 1px solid var(--td-component-border);
}

.property-panel__tabs {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
}

.property-panel__content {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    padding: 16px;
    box-sizing: border-box;
}

:deep(.t-tabs) {
    display: flex;
    flex-direction: column;
    height: 100%;
}

:deep(.t-tabs__content) {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
}

.property-panel__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.property-panel__field--full {
    width: 100%;
}

.property-panel__label {
    font-size: 13px;
    color: var(--td-text-color-secondary);
}

.property-panel__switches {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 4px;
}

.property-panel__options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    min-width: 0;
}

.property-panel__option-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    gap: 8px;
    align-items: center;
    width: 100%;
    min-width: 0;

    :deep(.t-input) {
        width: 100%;
        min-width: 0;
    }
}
</style>
