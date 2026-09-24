<script setup lang="ts">
import {
    createMockDataPool,
    deleteMockDataPool,
    getMockDataPool,
    getMockDataPoolPage,
    updateMockDataPool,
} from '@/api/mockData';
import { DialogLink, ModalForm, type ProFormOption } from '@/components/ProComponents';
import useCopy from '@/hooks/core/useCopy';
import type { MockDataPool } from '@/types/api/mockData';
import { DialogPlugin, MessagePlugin, type DialogInstance, type PageInfo } from 'tdesign-vue-next';
import { ref, watch } from 'vue';
import GenerateCodeModal from './components/GenerateCodeModal/index.vue';

const PAGE_SIZE = 7;

const keyword = ref('');
const loading = ref(false);
const dataList = ref<MockDataPool[]>([]);
const pageNum = ref(1);
const total = ref(0);
const visible = ref(false);
const currentId = ref<Nullable<string>>(null);
const generateVisible = ref(false);
const generateItem = ref<MockDataPool | null>(null);

const proFormOptions = ref<ProFormOption[]>([
    {
        name: 'name',
        label: '名称',
        placeholder: '请输入名称',
        rules: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    },
    {
        name: 'description',
        label: '描述',
        placeholder: '请输入描述',
    },
    {
        name: 'dataContent',
        label: '数据',
        placeholder: '请输入数据，多个值用英文逗号分隔',
        rules: [{ required: true, message: '请输入数据', trigger: 'blur' }],
    },
]);

function parseDataContent(content?: string) {
    if (!content) {
        return [];
    }
    const text = content.trim();
    if (text.startsWith('[')) {
        try {
            const parsed = JSON.parse(text);
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch {
            return [];
        }
    }
    return text.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

function formatDataContent(values: string[]) {
    return values.join(',');
}

function formatDataPreview(values: string[]) {
    return values.map((item) => `"${item}"`).join(',');
}

async function fetchList(targetPage = pageNum.value) {
    loading.value = true;
    try {
        const result = await getMockDataPoolPage({
            pageNum: targetPage,
            pageSize: PAGE_SIZE,
            form: {
                keyword: keyword.value.trim() || undefined,
            },
        });
        dataList.value = result.list || [];
        total.value = result.total || 0;
        pageNum.value = result.pageNum || targetPage;
        if (!dataList.value.length && total.value > 0 && pageNum.value > 1) {
            await fetchList(pageNum.value - 1);
        }
    } finally {
        loading.value = false;
    }
}

function handlePageChange(pageInfo: PageInfo) {
    fetchList(pageInfo.current);
}

function handleSearch() {
    fetchList(1);
}

async function modalRequest() {
    if (!currentId.value) {
        return null;
    }
    const data = await getMockDataPool(currentId.value);
    const values = parseDataContent(data?.dataContent);
    return {
        ...data,
        dataContent: formatDataContent(values),
    };
}

function openModal(id: Nullable<string>) {
    currentId.value = id;
    visible.value = true;
}

function handleSubmit(data: Record<string, any>) {
    const payload = {
        ...data,
        description: data.description || '',
    };
    const fn = currentId.value ? updateMockDataPool : createMockDataPool;
    if (currentId.value) {
        (payload as any).id = currentId.value;
    }
    fn(payload as any).then(() => {
        MessagePlugin.success('操作成功');
        visible.value = false;
        fetchList();
    });
}

function handleDelete(id: string, instance: DialogInstance) {
    deleteMockDataPool(id).then(() => {
        MessagePlugin.success('删除成功');
        instance.destroy();
        fetchList();
    });
}

function handleCopy(item: MockDataPool) {
    const values = parseDataContent(item.dataContent);
    useCopy(formatDataPreview(values)).then(() => {
        MessagePlugin.success('已复制数据');
    }).catch((error) => {
        MessagePlugin.error(String(error));
    });
}

function handlePreview(item: MockDataPool) {
    const values = parseDataContent(item.dataContent);
    DialogPlugin.alert({
        header: `${item.name} 数据预览`,
        body: values.length ? values.join('、') : '暂无数据',
        confirmBtn: '知道了',
    });
}

function handleGenerate(item: MockDataPool) {
    generateItem.value = item;
    generateVisible.value = true;
}

watch(keyword, () => {
    handleSearch();
}, { immediate: true });
</script>

<template>
    <div class="micro-data-page">
        <div class="micro-data-page__toolbar">
            <div class="micro-data-page__pool-title">
                数据池 <span>{{ total }}</span>
            </div>
            <div class="micro-data-page__toolbar-actions">
                <t-input
                    v-model="keyword"
                    clearable
                    placeholder="请输入"
                    class="micro-data-page__search"
                    @enter="handleSearch"
                    @clear="handleSearch"
                >
                    <template #suffix-icon>
                        <MyIcon name="Search" :size="16" />
                    </template>
                </t-input>
                <t-button theme="primary" @click="openModal(null)">新建数据</t-button>
            </div>
        </div>

        <t-loading :loading="loading">
            <div class="micro-data-page__list">
                <div
                    v-for="item in dataList"
                    :key="item.id"
                    class="micro-data-page__item"
                >
                    <div class="micro-data-page__item-main">
                        <div class="micro-data-page__item-name">{{ item.name }}</div>
                        <div class="micro-data-page__item-desc">{{ item.description || '-' }}</div>
                    </div>

                    <div class="micro-data-page__item-data">
                        <span class="micro-data-page__item-data-label">数据</span>
                        <div class="micro-data-page__item-tags">
                            <t-tag
                                v-for="value in parseDataContent(item.dataContent)"
                                :key="`${item.id}-${value}`"
                                variant="light"
                                size="small"
                            >
                                {{ value }}
                            </t-tag>
                        </div>
                        <div class="micro-data-page__item-icons">
                            <t-button
                                variant="text"
                                shape="square"
                                size="small"
                                @click="handleCopy(item)"
                            >
                                <MyIcon name="Copy" :size="16" />
                            </t-button>
                            <t-button
                                variant="text"
                                shape="square"
                                size="small"
                                @click="handlePreview(item)"
                            >
                                <MyIcon name="Eye" :size="16" />
                            </t-button>
                        </div>
                    </div>

                    <div class="micro-data-page__item-actions">
                        <t-link hover="color" theme="primary" @click="handleGenerate(item)">生成</t-link>
                        <t-link hover="color" theme="primary" @click="openModal(item.id)">编辑</t-link>
                        <DialogLink
                            hover="color"
                            theme="danger"
                            header="提示"
                            content="是否删除此映射数据"
                            @confirm="(instance: DialogInstance) => handleDelete(item.id, instance)"
                        >
                            删除
                        </DialogLink>
                    </div>
                </div>

                <t-empty v-if="!loading && !dataList.length" description="暂无数据" />
            </div>
        </t-loading>

        <div v-if="total > 0" class="micro-data-page__pagination">
            <t-pagination
                v-model="pageNum"
                :total="total"
                :page-size="PAGE_SIZE"
                :show-page-size="false"
                show-jumper
                @change="handlePageChange"
            />
        </div>

        <ModalForm
            v-model:visible="visible"
            :header="currentId ? '编辑数据' : '新建数据'"
            :options="proFormOptions"
            :request="modalRequest"
            width="520px"
            @submit="handleSubmit"
        />

        <GenerateCodeModal
            v-model:visible="generateVisible"
            :item="generateItem"
        />
    </div>
</template>

<style scoped lang="scss">
.micro-data-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 100%;
    color: var(--td-text-color-primary);
}

.micro-data-page__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.micro-data-page__pool-title {
    font-size: 16px;
    font-weight: 600;

    span {
        margin-left: 4px;
        color: var(--td-text-color-secondary);
        font-weight: 400;
    }
}

.micro-data-page__toolbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.micro-data-page__search {
    width: 220px;
}

.micro-data-page__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.micro-data-page__pagination {
    display: flex;
    justify-content: flex-end;
    padding-top: 4px;
}

.micro-data-page__item {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr) 180px;
    gap: 16px;
    align-items: center;
    padding: 18px 20px;
    border-radius: var(--td-radius-large);
    background: var(--td-bg-color-container);
}

.micro-data-page__item-main {
    min-width: 0;
}

.micro-data-page__item-name {
    font-size: 15px;
    font-weight: 600;
}

.micro-data-page__item-desc {
    margin-top: 6px;
    color: var(--td-text-color-secondary);
    font-size: 13px;
}

.micro-data-page__item-data {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.micro-data-page__item-data-label {
    flex-shrink: 0;
    color: var(--td-text-color-secondary);
}

.micro-data-page__item-tags {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
}

.micro-data-page__item-icons {
    display: flex;
    flex-shrink: 0;
    gap: 4px;
}

.micro-data-page__item-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
}

@media (max-width: 1100px) {
    .micro-data-page__item {
        grid-template-columns: 1fr;
        align-items: flex-start;
    }

    .micro-data-page__item-actions {
        justify-content: flex-start;
    }
}
</style>
