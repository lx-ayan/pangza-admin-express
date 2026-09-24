<script setup lang='ts'>
import Layout from '@/components/business/Layout/index.vue';
import { Transition } from 'vue';
</script>
<template>
    <div class="h-full">
        <Layout>
            <RouterView #default="{ Component, route }">
                <Transition name="translate" mode="out-in" :key="route.path">
                    <component :is="Component" :key="route.path" />
                </Transition>
            </RouterView>
        </Layout>
    </div>
</template>
