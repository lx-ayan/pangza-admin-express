<script setup lang='ts'>

const modelValue = defineModel<string[]>('modelValue', {
    default: () => []
});
const options = [
    {
        label: '斑马纹',
        value: 'stripe'
    },
    {
        label: '边框',
        value: 'border'
    },
    {
        label: '悬浮',
        value: 'hover'
    }
]
</script>
<template>
    <t-popup placement="bottom">
        <t-button variant="outline" theme="base">
            <template #icon>
                <MyIcon size="16px" name="Box" />
            </template>
        </t-button>

        <template #content>
            <div class="p-2">
                <t-checkbox-group class="flex flex-col gap-1" v-model="modelValue">
                    <div class="w-[100px]" v-for="item in options">
                        <t-checkbox class="mb-0" :value="item.value">{{ item.label }}</t-checkbox>
                    </div>
                </t-checkbox-group>
            </div>
        </template>
    </t-popup>
</template>