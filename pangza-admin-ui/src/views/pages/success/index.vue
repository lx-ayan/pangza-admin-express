<script setup lang='ts'>

</script>
<template>
  <t-card class="h-full flex pt-20 justify-center" :bordered="false">
    <Success otherMessage="这里是其他内容信息" title="操作成功"
      description="提交结果页用于反馈一系列操作任务的处理结果，如果仅是简单操作，使用 Message 全局提示反馈即可。灰色区域可以显示一些补充的信息。">
      <template #action>
        <t-space>
          <t-button variant="outline" theme="primary">返回列表</t-button>
          <t-button>继续添加</t-button>
        </t-space>
      </template>
    </Success>
  </t-card>
</template>