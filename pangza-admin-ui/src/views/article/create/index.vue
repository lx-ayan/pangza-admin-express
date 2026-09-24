<script setup lang='ts'>
import { MdEditor } from 'md-editor-v3';
import { ref } from 'vue';
const content = ref('');
</script>
<template>
    <div>
        <Grid>
            <GridItem :colSpan="6"></GridItem>
            <GridItem :colSpan="12">
                <t-input class="mb-3" placeholder="请输入文章标题"></t-input>

                <MdEditor :single="true" :preview="false" :preview-only="true" v-model="content" />

                <t-card :bordered="false" class="mt-6">
                    <div class=" font-bold text-base mb-3">
                        发布设置
                    </div>
                    <t-upload theme="image" tips="图片大小不得超过 5MB">

                    </t-upload>

                    <t-button class=" float-end">发布文章</t-button>
                </t-card>
            </GridItem>
            <GridItem :colSpan="6"></GridItem>
        </Grid>

    </div>
</template>