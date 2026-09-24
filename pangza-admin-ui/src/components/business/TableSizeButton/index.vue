<script setup lang='ts'>
import { computed } from 'vue';

const modelValue = defineModel<string>('modelValue', {
    default: 'medium'
});

const options = computed(() => {
    return [
        {
            content: '紧凑',
            value: 'small',
            active: modelValue.value == 'small'
        },
        {
            content: '中等',
            value: 'medium',
            active: modelValue.value == 'medium'
        },
        {
            content: '宽松',
            value: 'large',
            active: modelValue.value == 'large'
        }
    ]
});

function handeClick({ value }: { value: string }) {
    modelValue.value = value;
}

</script>
<template>
    <t-dropdown @click="handeClick" :options="options" placement="bottom">
        <t-button variant="outline" theme="base">
            <template #icon>
                <MyIcon size="16px" name="ListFilter" />
            </template>
        </t-button>
    </t-dropdown>
</template>