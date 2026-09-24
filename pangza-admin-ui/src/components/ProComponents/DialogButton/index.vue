<script setup lang='ts'>
import { h, useSlots } from 'vue';
import { Button, DialogPlugin, type DialogCloseContext, type DialogInstance, type TdButtonProps, type TdDialogProps } from 'tdesign-vue-next';

const slots = useSlots();

const props = defineProps<{
    variant?: TdButtonProps['variant'];
    theme?: TdButtonProps['theme'];
    content: TdDialogProps['body'];
    header?: TdDialogProps['header'];
    dialogProps?: TdDialogProps;
    buttonProps?: TdButtonProps;
}>();

const emits = defineEmits<{
    (e: 'confirm', instance: DialogInstance, context: {
        e: MouseEvent | KeyboardEvent;
    }): void;
    (e: 'cancel', context: {
        e: MouseEvent;
    }): void;
    (e: 'close', context: DialogCloseContext): void;
}>();

function handleClick() {
    const instance = DialogPlugin.confirm({
        body: props.content || slots['content'],
        header: props.header,
        ...props.dialogProps,
        onConfirm: (e) => {
            emits('confirm', instance, e);
        },
        onCancel: (e) => {
            emits('cancel', e);
            instance.destroy();
        },
        onClose: (e) => {
            emits('close', e);
            instance.destroy();
        }
    })
}

defineOptions({
    name: 'DialogButton',
})

</script>

<template>
    <component @click.stop="handleClick" :is="h(Button, { ...$attrs, ...props, ...props.buttonProps }, slots)">
    </component>
</template>