<script setup lang='ts'>
import { h, useSlots } from 'vue';
import { Link, DialogPlugin, type DialogCloseContext, type DialogInstance, type TdButtonProps, type TdDialogProps, type TdLinkProps } from 'tdesign-vue-next';

const slots = useSlots();

const props = defineProps<{
    hover?: TdLinkProps['hover'];
    theme?: TdLinkProps['theme'];
    content?: TdDialogProps['body'];
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
    (e: 'visibleChange', v: boolean): void;



}>();

function handleClick() {
    const instance = DialogPlugin.confirm({
        body: props.content || slots['content'],
        header: props.header,
        ...props.dialogProps,
        onOpened: () => {
            emits('visibleChange', true);
        },
        onConfirm: (e) => {
            emits('confirm', instance, e);
        },
        onCancel: (e) => {
            emits('cancel', e);
            instance.destroy();
        },
        onClose: (e) => {
            emits('close', e);
            emits('visibleChange', false);
            instance.destroy();
        }
    })
}

defineOptions({
    name: 'DialogLink',
})

</script>

<template>
    <component @click.stop="handleClick" :is="h(Link, { ...props.buttonProps, ...$attrs, ...props }, slots)">
    </component>
</template>