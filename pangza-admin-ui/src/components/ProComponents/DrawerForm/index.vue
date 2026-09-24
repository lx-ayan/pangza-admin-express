<script setup lang='ts'>
import { Drawer, type TdDrawerProps, } from 'tdesign-vue-next';
import type { ProFormInstance, ProFormOption, ProFormProps } from '../ProForm/types';
import { nextTick, useTemplateRef, watch } from 'vue';

export interface ModalFormProps {
    options: ProFormOption[];
    request?: ProFormProps['request'];
    formProps?: Optional<ProFormProps, 'options'>;
    header?: TdDrawerProps['header'];
    width?: TdDrawerProps['size'];
    drawerProps?: TdDrawerProps;
}

const proFormRef = useTemplateRef<ProFormInstance>('proFormRef');

const emits = defineEmits<{
    (e: 'submit', data: any): void;
}>();

const props = withDefaults(defineProps<ModalFormProps>(), {
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
    name: 'DrawerForm',
})

watch(visible, async (value) => {
    if (!value) {
        proFormRef.value?.reset();
        return;
    }
    await nextTick();
    proFormRef.value?.request();
});

</script>

<template>
    <Drawer @confirm="handleConfirm" v-bind="{ ...$attrs, ...props.drawerProps }" :size="props.width"
        :header="props.header" v-model:visible="visible">
        <template v-for="key in Object.keys($slots)" #[key]="args">
            <slot :name="key" v-bind="args"></slot>
        </template>
        <div style="padding: 4px">
            <ProForm ref="proFormRef" :submit="handleSubmit" :request="props.request"
                :gap="{ y: props?.formProps?.formProps.labelAlign === 'top' ? 4 : 6, x: 0 }" v-bind="props.formProps"
                hideExtra :options="props.options">
                <template v-for="key in Object.keys($slots)" #[key]="args">
                    <slot :name="key" v-bind="args"></slot>
                </template>
            </ProForm>
        </div>
    </Drawer>
</template>