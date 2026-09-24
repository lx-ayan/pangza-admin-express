<script setup lang='tsx'>
import { MessagePlugin, type DialogInstance } from 'tdesign-vue-next';
function handleConfirm(instance: DialogInstance) {
    MessagePlugin.success('您点击了确认')
    instance.hide();
}

function handleCancel() {
    MessagePlugin.info('您点击了取消')
}

</script>
<template>
    <div>
        <DialogButton @cancel="handleCancel" @confirm="handleConfirm" header="弹窗按钮">
            <template #content>
                <div>
                    我是弹窗按钮内容
                </div>
            </template>
            弹窗按钮
        </DialogButton>
    </div>
</template>