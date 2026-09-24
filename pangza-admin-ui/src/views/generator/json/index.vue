<script setup lang='ts'>
import useCopy from '@/hooks/core/useCopy';
import jsonConvert from '@/utils/convert/jsonConvert';
import { MdEditor, MdPreview } from 'md-editor-v3';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

const content = ref('');

const resultContent = ref({ ts: '', java: '' });

const isUndefined = ref(true);

function handleGenerator() {
    if (!content.value) {
        MessagePlugin.error('转换内容不能为空');
        return;
    }
    try {
        resultContent.value = jsonConvert.convert(content.value, isUndefined.value);
    } catch (e) {
        MessagePlugin.error(e.message);
    }
}

function handleCopy(code: string) {
    if (!code) return;
    useCopy(code).then(() => {
        MessagePlugin.success('复制成功');
    })
}


</script>
<template>
    <Grid class="h-full" :cols="2" :gap="8">
        <GirdItem class="h-full">
            <t-card :bordered="false" class="h-full">
                <template #title>
                    JSON 转 TS、Java 工具
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
            <t-collapse>
                <t-collapse-panel header="TS 代码">
                    <t-card :bordered="false">
                        <template #actions>
                            <span class="cursor-pointer" @click="handleCopy(resultContent.ts)">复制代码</span>
                        </template>
                        <MdPreview v-model="resultContent.ts" />
                    </t-card>
                </t-collapse-panel>
                <t-collapse-panel header="Java 代码">
                    <t-card :bordered="false">
                        <template #actions>
                            <span class="cursor-pointer" @click="handleCopy(resultContent.java)">复制代码</span>
                        </template>
                        <MdPreview v-model="resultContent.java" />
                    </t-card>
                </t-collapse-panel>
            </t-collapse>

        </GridItem>
    </Grid>
</template>