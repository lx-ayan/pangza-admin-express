<script setup lang='ts'>
import { getIconMap } from '@/utils/components';
import { ref, useTemplateRef } from 'vue';
import useCopy from '@/hooks/core/useCopy';
import { MessagePlugin } from 'tdesign-vue-next';
import useLight from '@/hooks/components/useLight';
import ArrayUtil from '@/utils/clz/ArrayUtil';
import type { ProTableInstance, ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';
const iconMap = Object.values(getIconMap());
const showIcon = ref(iconMap);
const visible = ref(false);

const proTableRef = useTemplateRef<ProTableInstance>('proTableRef');

const emits = defineEmits<{ (e: 'choose', iconName: string): void; }>();

const options: ProTableOption[] = [
    { label: '图标名称', key: 'name', span: 9, formProps: { placeholder: '请输入图标名称' } },
    {
        label: '复制模式',
        key: 'mode',
        type: 'radio',
        span: 9,
        data: [
            { label: '复制名称', value: '1' },
            { label: '复制组件', value: '2' }
        ],
        defaultValue: '1'
    }
]

function handleRequest(data: ProTableRequest<{ name: string }>) {
    const { pageNum, pageSize, form: { name } } = data;
    let total = iconMap.length;
    if (name) {
        showIcon.value = iconMap.filter(item => item.toLowerCase().includes(name.toLowerCase()));
        total = showIcon.value.length;
    } else {
        showIcon.value = iconMap;
        total = showIcon.value.length;
    }
    showIcon.value = ArrayUtil.paginateArray(showIcon.value, pageNum, pageSize);
    return {
        list: showIcon.value,
        total
    }
}

function handleItemClick(iconName: string) {
    const mode = proTableRef.value.getFormValue()?.mode;
    emits('choose', iconName);
    useCopy(mode == '1' ? iconName : `<MyIcon name="${iconName}"/>`).then(() => {
        MessagePlugin.success('复制成功');
        visible.value = false;
    }).catch(e => {
        MessagePlugin.error(e);
    })
}

const highlightKeyword = (text: string) => {
    const name = proTableRef.value.getFormValue()?.name;
    return useLight(text, name);
};

</script>
<template>
    <div>
        <t-dialog :footer="false" top="5%" width="70%" v-model:visible="visible" header="图标选择器">
            <ProTable :pageProps="{ pageSize: 32, pageSizeOptions: [5, 10, 32, 50] }" ref="proTableRef"
                :request="handleRequest" :options>
                <template #card="{ list }">
                    <Grid cols="8" :gap="{ x: 8, y: 8 }">
                        <template v-for="(key) in list">
                            <GridItem>
                                <div @click="() => handleItemClick(key)"
                                    class="text-center flex items-center justify-center h-[120px] cursor-pointer hover:bg-gray-100 dark:hover:bg-[var(--td-bg-color-page)]">
                                    <div>
                                        <MyIcon :size="40" class="mx-auto" :name="key"></MyIcon>
                                        <div v-html="highlightKeyword(key)" class="mt-3">
                                        </div>
                                    </div>
                                </div>
                            </GridItem>
                        </template>
                    </Grid>
                </template>
            </ProTable>
        </t-dialog>
        <t-button @click="visible = true">图标选择</t-button>
    </div>
</template>

<style lang="scss"></style>