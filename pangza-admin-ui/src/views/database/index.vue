<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import DatabasePage from '../tools/database/index.vue';

const router = useRouter();
const activeTab = ref('database');

function handleTabChange(value: string | number) {
    if (value === 'warehouse') {
        router.push('/data');
    }
}

onMounted(() => {
    activeTab.value = 'database';
});
</script>

<template>
    <div class="micro-data-page">
        <div class="micro-data-page__header">
            <div class="micro-data-page__title">微数据</div>
            <t-tabs v-model="activeTab" class="micro-data-page__tabs" @change="handleTabChange">
                <t-tab-panel value="database" label="创建库表">
                    <template #label>
                        <span class="micro-data-page__tab-label">
                            <MyIcon name="Settings" :size="16" />
                            创建库表
                        </span>
                    </template>
                </t-tab-panel>
                <t-tab-panel value="warehouse" label="数据仓库">
                    <template #label>
                        <span class="micro-data-page__tab-label">
                            <MyIcon name="Database" :size="16" />
                            数据仓库
                        </span>
                    </template>
                </t-tab-panel>
            </t-tabs>
        </div>

        <DatabasePage />
    </div>
</template>

<style scoped lang="scss">
.micro-data-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 100%;
}

.micro-data-page__header {
    display: flex;
    align-items: center;
    gap: 32px;
}

.micro-data-page__title {
    font-size: 20px;
    font-weight: 600;
}

.micro-data-page__tab-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
</style>
