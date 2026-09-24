<script setup lang='ts'>
import { Dialog, type TdDialogProps } from 'tdesign-vue-next';
import type { ProFormInstance, ProFormOption, ProFormProps } from '../ProForm/types';
import { nextTick, useTemplateRef, watch } from 'vue';

const proFormRef = useTemplateRef<ProFormInstance>('proFormRef');

const emits = defineEmits<{
    (e: 'submit', data: any): void;
    (e: 'visibleChange', visible: boolean): void;
}>();

const props = withDefaults(defineProps<{
    options: ProFormOption[];
    request?: ProFormProps['request'];
    formProps?: Optional<ProFormProps, 'options'>;
    header?: TdDialogProps['header'];
    width?: TdDialogProps['width'];
    stopRequest?: boolean;
    dialogProps?: TdDialogProps;
}>(), {
    options: () => [],
    formProps: () => ({
        formProps: {
            labelAlign: 'top'
        }
    })
});

const visible = defineModel('visible', { default: false });

function handleConfirm() {
    proFormRef.value?.validate().then(res => {
        if (res === true) {
            proFormRef.value?.submit();
        }
    })
}

function handleSubmit(data: any) {
    emits('submit', data);
}

defineOptions({
    name: 'ModalForm',
})

watch(visible, async (value) => {
    emits('visibleChange', value);
    if (!value) {
        proFormRef.value?.reset();
        return;
    }
    await nextTick();
    proFormRef.value?.request();
});

defineExpose({
    request: () => {
        proFormRef.value?.request();
    },
    reset: () => {
        proFormRef.value?.reset();
    },
    open: () => {
        visible.value = true;
    },
    close: () => {
        visible.value = false;
    },
    setFormItem: (key: string, value: any) => {
        proFormRef.value?.setFormItem(key, value);
    },
    getFormItem: (key: string) => {
        return proFormRef.value?.getFormItem(key);
    },
    getFormValue: () => {
        return proFormRef.value?.getFormValue();
    },
    validate: () => {
        return proFormRef.value?.validate();
    }
})

</script>

<template>
    <Dialog @confirm="handleConfirm" v-bind="{ ...$attrs, ...props.dialogProps }" :width="props.width"
        :header="props.header" v-model:visible="visible">
        <template v-for="key in Object.keys($slots)" #[key]="args">
            <slot :name="key" v-bind="args"></slot>
        </template>
        <div style="padding: 4px">
            <ProForm :stopRequest="props.stopRequest" ref="proFormRef" :submit="handleSubmit" :request="props.request"
                :gap="{ y: props?.formProps?.formProps?.labelAlign === 'top' ? 4 : 6, x: 4 }" v-bind="props.formProps"
                hideExtra :options="props.options">
                <template v-for="key in Object.keys($slots)" #[key]="args">
                    <slot :name="key" v-bind="args"></slot>
                </template>
            </ProForm>
        </div>
    </Dialog>
</template>