<script setup lang='ts'>
import StringUtil from "@/utils/clz/StringUtil";
import { getIconMap } from "@/utils/components";
import * as icons from "lucide-vue-next";
import { computed } from "vue";

export interface MyIconProps {
    name: string;
    size?: number;
    color?: string;
    strokeWidth?: number;
    defaultClass?: string;
}

const props = defineProps<MyIconProps>();

const nameMap: Record<string, string> = getIconMap();

const icon = computed(() => {
    return icons[nameMap[StringUtil.camelToKebab(props.name)]] as any;
});

defineOptions({
    name: 'MyIcon',
    globalComponent: true
})

</script>
<template>
    <component :size="props.size" :color="props.color" :default-class="props.defaultClass"
        :stroke-width="props.strokeWidth" :is="icon"></component>
</template>