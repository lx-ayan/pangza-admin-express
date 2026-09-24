<script setup lang='ts'>
const props = defineProps<{ data: any }>();
</script>
<template>
    <div class="rounded-lg overflow-hidden border border-black/10 dark:border-white/10">
        <div>
            <img class="h-[200px] w-full" :src="props.data.poster" alt="">
        </div>
        <div class="p-4">
            <div class="text-base font-bold text-ellipsis text-nowrap mb-2">
                {{ props.data.title }}
            </div>

            <div class="flex text-slate-500 justify-between">
                <span>
                    {{ props.data.author }}
                </span>
                <span>
                    {{ props.data.createTime }}
                </span>
            </div>

        </div>
    </div>
</template>