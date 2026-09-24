<script setup lang='ts'>
import { useRouter } from 'vue-router';

const router = useRouter();

const handleBackHome = () => {
  router.push('/');
};

</script>
<template>
  <t-card class="h-full flex pt-20 justify-center" :bordered="false">
    <div class="text-center max-w-md p-8">
      <!-- 403 图标 -->
      <div
        class="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
        <svg class="w-14 h-14 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z">
          </path>
        </svg>
      </div>

      <!-- 标题和描述 -->
      <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-4">403</h1>
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">权限不足</h2>
      <p class="text-gray-500 dark:text-gray-300 mb-8">
        很抱歉，您没有访问该页面的权限。请联系管理员获取更多信息或尝试访问其他页面。
      </p>

      <!-- 按钮组 -->
      <div class="flex flex-col sm:flex-row justify-center gap-3">
        <div class="flex flex-col sm:flex-row justify-center gap-3">
          <t-button size="large" theme="warning" @click="handleBackHome">
            返回首页
          </t-button>
          <t-button size="large" theme="base">
            联系管理员
          </t-button>
        </div>
      </div>
    </div>
  </t-card>
</template>