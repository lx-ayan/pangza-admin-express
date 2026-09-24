<script setup lang='tsx'>
import { computed, useSlots, type VNode } from 'vue';
import useColor from '@/hooks/components/useColor';

type LabelOrDescriptionOrIcon = string | VNode | Object | Function;

type ActionListOption = { label: LabelOrDescriptionOrIcon, description: LabelOrDescriptionOrIcon, value: any, icon: LabelOrDescriptionOrIcon } & OtherParam;

const { borderColor } = useColor();

const props = withDefaults(defineProps<{
    options: ActionListOption[];
    /** 是否显示项之间的下边框，与 borderless 同时使用时 borderless 优先生效 */
    border?: boolean;
    /** 为 true 时隐藏项之间的下边框 */
    borderless?: boolean;
    /** 列表项上下间距，可选 small / base / large */
    size?: SizeEnum;
    titleColor?: string;
    descriptionColor?: string;
}>(), {
    border: true,
    borderless: false,
    size: 'base',
    titleColor: '',
    descriptionColor: 'text-gray-500'
});

/** 是否显示项之间的下边框 */
const showBorder = computed(() => !props.borderless && props.border);

/** 列表项垂直内边距 */
const itemPaddingClass = computed(() => {
    switch (props.size) {
        case 'small':
            return 'py-1';
        case 'large':
            return 'py-3';
        default:
            return 'py-2';
    }
});

/** 列表项之间的间距 */
const itemGapClass = computed(() => {
    switch (props.size) {
        case 'small':
            return 'space-y-1';
        case 'large':
            return 'space-y-4';
        default:
            return 'space-y-2';
    }
});

const slots = useSlots();

const emits = defineEmits<{
    (e: 'click', value: any, context: ActionListOption);
}>();

function handleClick(value: any, context: ActionListOption) {
    emits('click', value, context);
}

const getLabelOrDescriptionOrIcon = (option: ActionListOption, type: 'label' | 'description' | 'icon' = "label") => {
    const slotKey = type + '-' + option.value;

    if (slots[slotKey]) {
        return slots[slotKey];
    }
    if (typeof option[type] === 'string') {
        return () => <span>{option[type]}</span>
    } else {
        return option[type];
    }
}

defineOptions({
    name: 'ActionList',
    globalComponent: true,
    inheritAttrs: false
})
</script>

<template>
    <div :class="itemGapClass">
        <div v-for="(item, index) in props.options" class="flex items-center justify-between border-color"
            :class="[itemPaddingClass, { 'border-b': showBorder && index !== props.options.length - 1 }]">
            <div class="flex items-center gap-3">
                <component :is="getLabelOrDescriptionOrIcon(item, 'icon')"></component>
                <div @click="handleClick(item.value, item)">
                    <div :class="`text-sm ${props.titleColor}`">
                        <component :is="getLabelOrDescriptionOrIcon(item)"></component>
                    </div>
                    <div :class="`text-xs ${props.descriptionColor}`">
                        <component :is="getLabelOrDescriptionOrIcon(item, 'description')"></component>
                    </div>
                </div>
            </div>
            <div class="relative inline-flex items-center cursor-pointer">
                <slot :name="`action-${item.value}`" :option="item"></slot>
            </div>
        </div>
    </div>
</template>


<style lang="scss" scoped>
.border-color {
    border-color: v-bind('borderColor');
}
</style>