<script setup lang='ts'>
import useTabStore from '@/store/tabStore';
import { getCssVar } from '@/utils/core/css';
import { useRouter } from 'vue-router';

const tabStore = useTabStore();
const router = useRouter();

const handleBackHome = () => {
  router.push('/');
  tabStore.setActiveTab('/home');
};

const handleReload = () => {
  window.location.reload();
};
</script>
<template>
  <t-card class="h-full flex pt-20 justify-center" :bordered="false">
    <div class="text-center max-w-md p-8">
      <!-- 404 图标 -->

      <div class="flex justify-center mb-8">
        <ColorIcon size="43px" width="6rem" height="6rem" :color="getCssVar('--td-brand-color')" name="eye">
        </ColorIcon>
      </div>

      <!-- 标题和描述 -->
      <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
      <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6">页面不存在</h2>
      <p class="text-gray-500 dark:text-gray-300 mb-8">
        很抱歉，您访问的页面不存在或已被移除。请检查您输入的网址是否正确，或返回首页重新开始。
      </p>

      <!-- 按钮组 -->
      <div class="flex flex-col sm:flex-row justify-center gap-3">
        <t-button size="large" @click="handleBackHome">
          返回首页
        </t-button>
        <t-button size="large" theme="base" @click="handleReload">
          重新加载
        </t-button>
      </div>
    </div>
  </t-card>
</template>
