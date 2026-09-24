<script setup lang="ts">
</script>

<template>
    <Error
        title="操作失败"
        description="操作过程中发生了错误，请检查您的输入或稍后重试。如果问题持续存在，请联系系统管理员。"
        other-message="系统错误代码：ERR-500"
    >
        <template #action>
            <t-space>
                <t-button variant="outline" theme="danger">返回列表</t-button>
                <t-button theme="danger">重新加载</t-button>
            </t-space>
        </template>
    </Error>
</template>
