import type { FormDesignerConfig, FormDesignerItem } from '../types';

function escapeStr(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildDefaultValue(item: FormDesignerItem) {
    if (item.defaultValue === undefined || item.defaultValue === '') {
        if (item.type === 'checkbox' || item.type === 'timeRangePicker' || item.type === 'dateRangePicker') {
            return '[]';
        }
        if (item.type === 'switch') {
            return 'false';
        }
        if (item.type === 'inputNumber' || item.type === 'slider' || item.type === 'rate') {
            return '0';
        }
        return "''";
    }
    if (typeof item.defaultValue === 'string') {
        return `'${escapeStr(item.defaultValue)}'`;
    }
    if (typeof item.defaultValue === 'boolean' || typeof item.defaultValue === 'number') {
        return String(item.defaultValue);
    }
    return JSON.stringify(item.defaultValue);
}

function buildRules(item: FormDesignerItem) {
    if (!item.required || item.type === 'button' || item.type === 'row') {
        return '';
    }
    return `    ${item.field}: [{ required: true, message: '请输入${item.label}' }],\n`;
}

function buildControl(item: FormDesignerItem) {
    const attrs: string[] = [];
    if (item.placeholder) {
        attrs.push(`placeholder="${item.placeholder}"`);
    }
    if (item.clearable) {
        attrs.push('clearable');
    }
    if (item.readonly) {
        attrs.push('readonly');
    }
    if (item.disabled) {
        attrs.push('disabled');
    }
    if (item.maxLength) {
        attrs.push(`:maxlength="${item.maxLength}"`);
    }
    if (item.showLimitNumber) {
        attrs.push('show-limit-number');
    }
    if (item.width && item.width !== '100%') {
        attrs.push(`style="width: ${item.width}"`);
    }
    const attrStr = attrs.length ? ` ${attrs.join(' ')}` : '';

    switch (item.type) {
        case 'input':
            return `<t-input v-model="formData.${item.field}"${attrStr} />`;
        case 'textarea':
            return `<t-textarea v-model="formData.${item.field}"${attrStr} />`;
        case 'password':
            return `<t-input v-model="formData.${item.field}" type="password"${attrStr} />`;
        case 'inputNumber':
            return `<t-input-number v-model="formData.${item.field}" :min="${item.min ?? 0}" :max="${item.max ?? 100}" :step="${item.step ?? 1}"${attrStr} />`;
        case 'select':
            return `<t-select v-model="formData.${item.field}" :options="${item.field}Options"${attrStr} />`;
        case 'cascader':
            return `<t-cascader v-model="formData.${item.field}" :options="${item.field}Options"${attrStr} />`;
        case 'radio':
            return `<t-radio-group v-model="formData.${item.field}" :options="${item.field}Options"${attrStr} />`;
        case 'checkbox':
            return `<t-checkbox-group v-model="formData.${item.field}" :options="${item.field}Options"${attrStr} />`;
        case 'switch':
            return `<t-switch v-model="formData.${item.field}"${attrStr} />`;
        case 'slider':
            return `<t-slider v-model="formData.${item.field}" :min="${item.min ?? 0}" :max="${item.max ?? 100}" :step="${item.step ?? 1}"${attrStr} />`;
        case 'timePicker':
            return `<t-time-picker v-model="formData.${item.field}"${attrStr} />`;
        case 'timeRangePicker':
            return `<t-time-range-picker v-model="formData.${item.field}"${attrStr} />`;
        case 'datePicker':
            return `<t-date-picker v-model="formData.${item.field}"${attrStr} />`;
        case 'dateRangePicker':
            return `<t-date-range-picker v-model="formData.${item.field}"${attrStr} />`;
        case 'rate':
            return `<t-rate v-model="formData.${item.field}" :count="${item.max ?? 5}"${attrStr} />`;
        case 'colorPicker':
            return `<t-color-picker v-model="formData.${item.field}"${attrStr} />`;
        case 'upload':
            return `<t-upload theme="file">${item.buttonText || '点击上传'}</t-upload>`;
        case 'button':
            return `<t-button theme="${item.buttonTheme || 'primary'}">${item.buttonText || item.label}</t-button>`;
        default:
            return `<t-input v-model="formData.${item.field}"${attrStr} />`;
    }
}

function buildFormItem(item: FormDesignerItem, indent = '    '): string {
    if (item.type === 'row') {
        const rowContent = buildGridItems(item.children || [], `${indent}    `);
        return `${indent}<div class="form-row">\n${rowContent || `${indent}    <!-- 行容器为空 -->`}\n${indent}</div>`;
    }
    if (item.type === 'button') {
        return `${indent}<t-form-item>\n${indent}    ${buildControl(item)}\n${indent}</t-form-item>`;
    }
    return `${indent}<t-form-item label="${item.label}" name="${item.field}">\n${indent}    ${buildControl(item)}\n${indent}</t-form-item>`;
}

function buildColItem(item: FormDesignerItem, indent: string): string {
    const span = item.type === 'row' ? 24 : (item.span || 24);
    return `${indent}<t-col :span="${span}">\n${buildFormItem(item, `${indent}    `)}\n${indent}</t-col>`;
}

function buildGridItems(items: FormDesignerItem[], indent = '    '): string {
    const rows: string[] = [];
    let currentRow: FormDesignerItem[] = [];
    let currentSpan = 0;

    const flushRow = () => {
        if (!currentRow.length) {
            return;
        }
        const cols = currentRow.map((item) => buildColItem(item, `${indent}    `)).join('\n');
        rows.push(`${indent}<t-row :gutter="[16, 16]">\n${cols}\n${indent}</t-row>`);
        currentRow = [];
        currentSpan = 0;
    };

    items.forEach((item) => {
        const span = item.type === 'row' ? 24 : (item.span || 24);
        if (currentSpan > 0 && currentSpan + span > 24) {
            flushRow();
        }
        currentRow.push(item);
        currentSpan += span;
        if (currentSpan >= 24) {
            flushRow();
        }
    });
    flushRow();

    return rows.join('\n');
}

function buildOptionsVars(items: FormDesignerItem[]) {
    const lines: string[] = [];
    items.forEach((item) => {
        if (item.options?.length && ['select', 'cascader', 'radio', 'checkbox'].includes(item.type)) {
            lines.push(`const ${item.field}Options = ${JSON.stringify(item.options, null, 4)};`);
        }
        if (item.children?.length) {
            lines.push(...buildOptionsVars(item.children).split('\n').filter(Boolean));
        }
    });
    return lines.join('\n');
}

function flattenItems(items: FormDesignerItem[]): FormDesignerItem[] {
    return items.flatMap((item) => {
        if (item.type === 'row') {
            return flattenItems(item.children || []);
        }
        if (item.type === 'button') {
            return [];
        }
        return [item];
    });
}

/** 生成 Vue 单文件代码 */
export function generateVueCode(items: FormDesignerItem[], config: FormDesignerConfig) {
    const flatItems = flattenItems(items);
    const formDataLines = flatItems.map((item) => `    ${item.field}: ${buildDefaultValue(item)},`).join('\n');
    const rulesLines = flatItems.map((item) => buildRules(item)).join('');
    const optionsLines = buildOptionsVars(items);
    const formItems = buildGridItems(items, '    ');

    return `<script setup lang="ts">
import { ref } from 'vue';

const formData = ref({
${formDataLines}
});

const rules = {
${rulesLines}};

${optionsLines}
</script>

<template>
  <t-form
    :data="formData"
    :rules="rules"
    label-width="${config.labelWidth}"
    label-align="${config.labelAlign}"
    :colon="${config.colon}"
    size="${config.size}"
  >
${formItems}
  </t-form>
</template>

<style scoped lang="scss">
.form-row {
  width: 100%;
}
</style>
`;
}

/** 下载 Vue 文件 */
export function downloadVueFile(code: string, filename = 'GeneratedForm.vue') {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
