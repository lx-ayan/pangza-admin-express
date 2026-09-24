<script setup lang='ts'>
const props = withDefaults(defineProps<{
    message: string
}>(), {
    message: '暂无数据'
});

defineOptions({
    name: 'EmptyData',
    globalComponent: true
})

</script>

<template>
    <div class="h-full flex items-center justify-center flex-col text-center">

        <div class="flex items-center justify-center mb-3">
            <MyIcon color="#c3c3c3" :strokeWidth="1.2" :size="50" name="box" />
        </div>

        <div class="text-[#C3C3C3]">
            {{ props.message }}
        </div>

        <div class="mt-3">
            <slot name="actions"></slot>
        </div>

    </div>
</template>

<style lang="scss" scoped></style>