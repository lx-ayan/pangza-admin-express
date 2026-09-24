<script setup lang='ts'>
import type { ProTableOption } from '@/components/ProComponents/ProTable/types';
import { MoveIcon } from 'tdesign-icons-vue-next';
import { onUnmounted } from 'vue';
import { useDraggable, type UseDraggableReturn } from 'vue-draggable-plus';

let draggable: Nullable<UseDraggableReturn> = null;

const options = defineModel<ProTableOption[]>('modelValue', {
    default: () => []
});

function handleChange(v: boolean, index: number) {
    console.log('v =', v);
    options.value[index].hideInTable = !v;
    console.log('options.value =', options.value);
}

function changeRef(e: HTMLDivElement) {
    // The return value is an object, which contains some methods, such as start, destroy, pause, etc.
    draggable = useDraggable(e, options, {
        animation: 150,
        onStart() {
            console.log('start')
        },
        onUpdate(...args) {
            console.log('update', args)
        }
    })
}

onUnmounted(() => {
    if (draggable) {
        draggable.destroy();
        draggable = null;
    }
})

</script>
<template>
    <div>
        <t-popup placement="bottom">
            <t-button variant="outline" theme="base">
                <template #icon>
                    <MyIcon size="16px" name="Settings" />
                </template>
            </t-button>

            <template #content>
                <div :ref="changeRef" class="p-3">
                    <div class="mt-1 flex items-center w-[120px]" v-for="(item, index) in options">
                        <MoveIcon class="mr-2" />
                        <t-checkbox @change="(v: boolean) => handleChange(v, index)" :checked="!item.hideInTable"
                            :value="item.key">{{
                                item.label || item.tableTitle
                            }}</t-checkbox>
                    </div>
                </div>
            </template>
        </t-popup>
    </div>
</template>