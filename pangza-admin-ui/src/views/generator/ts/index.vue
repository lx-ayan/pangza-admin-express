<script setup lang='ts'>
import javaToTsConverter from '@/utils/convert/javaToTsConverter';
import { MdEditor, MdPreview } from 'md-editor-v3';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const content = ref('');

const tsContent = ref('');

const isUndefined = ref(true);

function handleGenerator() {
    if (!content.value) {
        MessagePlugin.error('转换内容不能为空');
        return;
    }
    try {
        console.log('content.value =', content.value);
        tsContent.value = javaToTsConverter.convert(content.value, isUndefined.value);
    } catch (e) {
        MessagePlugin.error(e.message);
    }
}


</script>
<template>
    <Grid class="h-full" :cols="2" :gap="8">
        <GirdItem class="h-full">
            <t-card :bordered="false" class="h-full">
                <template #title>
                    java 转 TS 工具
                </template>

                <template #actions>
                    <div class="flex items-center w-full">
                        <t-checkbox v-model:checked="isUndefined">是否可选</t-checkbox>
                        <t-button style="margin-left: 20px;" @click="handleGenerator">一件转换</t-button>
                    </div>
                </template>
                <MdEditor v-model="content" :toolbars="[]" :preview="false" />
            </t-card>
        </GirdItem>
        <GridItem class="h-full">
            <t-card :bordered="false" class="h-full">
                <MdPreview v-model="tsContent" />
            </t-card>
        </GridItem>
    </Grid>
</template>