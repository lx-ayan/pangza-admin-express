import type { ProTableOption } from "@/components/ProComponents/ProTable/types";

export function buidCode(tableOptions: ProTableOption[], tableProps: Record<string, any>) {
    let buildPropsStr = '';

    Object.keys(tableProps).forEach(item => {
        buildPropsStr += ` :${item}="${tableProps[item]}"`
    })

    return `
<script lang="tsx" setup>
const options = computed(${JSON.stringify(tableOptions)});

function request() {
    return {

    }
}
</script>

<template>
    <ProForm :options :request ${buildPropsStr}/>
</template>
`
}