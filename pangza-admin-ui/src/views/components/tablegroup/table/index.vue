<script setup lang="ts">
import { nextTick, ref } from 'vue';
import BasicTable from './demos/BasicTable.vue';
import SearchTable from './demos/SearchTable.vue';
import CustomRenderTable from './demos/CustomRenderTable.vue';
import SelectTable from './demos/SelectTable.vue';
import DragTable from './demos/DragTable.vue';
import EditTable from './demos/EditTable.vue';
import CardRenderTable from './demos/CardRenderTable.vue';
import HookTable from './demos/HookTable.vue';

/** 锚点目录 */
const anchors = [
    { id: 'basic', title: '基础表格' },
    { id: 'search', title: '带搜索的表格' },
    { id: 'custom-render', title: '自定义列渲染' },
    { id: 'select', title: '行选择' },
    { id: 'drag', title: '可拖拽表格' },
    { id: 'edit', title: '编辑行' },
    { id: 'card-render', title: '自定义整块渲染' },
    { id: 'hook', title: '使用 Hook' },
];

const activeAnchor = ref(anchors[0].id);

/**
 * 滚动到对应示例区块
 */
async function scrollToAnchor(id: string) {
    activeAnchor.value = id;
    await nextTick();
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** 基础表格示例代码 */
const basicCode = `<script setup lang="tsx">
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';

const options: ProTableOption[] = [
  { key: 'username', label: '用户名' },
  { key: 'email', label: '邮箱', hideInSearch: true },
  { key: 'phone', label: '手机号', hideInSearch: true },
  { key: 'address', label: '地址', hideInSearch: true },
];

function request(_params: ProTableRequest) {
  const list = Array.from({ length: 5 }).map((_, i) => ({
    id: String(i + 1),
    username: ['贾明', '张三', '王芳', '李雷', '韩梅'][i],
    email: \`user\${i + 1}@demo.com\`,
    phone: \`1380000000\${i + 1}\`,
    address: ['北京', '上海', '广州', '深圳', '杭州'][i],
  }));
  return Promise.resolve({ list, total: list.length });
}
<\/script>

<template>
  <ProTable :options="options" :request="request" :hide-form="true" />
<\/template>`;

const searchCode = `<script setup lang="tsx">
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';

const options: ProTableOption[] = [
  { key: 'username', label: '用户名' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    data: [
      { label: '启用', value: '1' },
      { label: '禁用', value: '2' },
    ],
  },
  { key: 'deadline', label: '截止日期', type: 'datePicker' },
  { key: 'email', label: '邮箱', hideInSearch: true },
];

function request(params: ProTableRequest) {
  // 根据 params.form 过滤后返回 { list, total }
  return Promise.resolve({ list: [], total: 0 });
}
<\/script>

<template>
  <ProTable :options="options" :request="request" />
<\/template>`;

const customRenderCode = `<script setup lang="tsx">
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';
import CircleTag from '@/components/public/CircleTag/index.vue';

const options: ProTableOption[] = [
  {
    key: 'username',
    label: '用户名',
    render: (row) => <t-link theme="primary">{row.username}</t-link>,
  },
  {
    key: 'avatar',
    label: '头像',
    hideInSearch: true,
    render: (row) => (
      <t-image src={row.avatar} fit="cover" style={{ width: '40px', height: '40px' }} />
    ),
  },
  {
    key: 'status',
    label: '状态',
    render: (row) => (
      <CircleTag color={row.status === '启用' ? 'var(--td-success-color)' : 'var(--td-error-color)'}>
        {row.status}
      </CircleTag>
    ),
  },
  { key: 'action', label: '操作', hideInSearch: true },
];

function request(_params: ProTableRequest) {
  return Promise.resolve({ list: [], total: 0 });
}
<\/script>

<template>
  <ProTable :options="options" :request="request" :hide-form="true">
    <template #table-action>
      <t-space>
        <t-link theme="primary">编辑</t-link>
        <t-link theme="danger">删除</t-link>
      </t-space>
    </template>
  </ProTable>
<\/template>`;

const selectCode = `<script setup lang="tsx">
import { ref } from 'vue';
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';

const selectData = ref<{ values?: (string | number)[] }>({ values: [] });
const options: ProTableOption[] = [
  { key: 'username', label: '用户名' },
  { key: 'channel', label: '签署方式', hideInSearch: true },
];

function request(_params: ProTableRequest) {
  return Promise.resolve({ list: [], total: 0 });
}
<\/script>

<template>
  <ProTable
    v-model:select-data="selectData"
    select-able
    :options="options"
    :request="request"
    :hide-form="true"
  />
<\/template>`;

const dragCode = `<script setup lang="tsx">
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';

const options: ProTableOption[] = [
  { key: 'username', label: '用户名' },
  { key: 'matters', label: '明细', hideInSearch: true },
  { key: 'channel', label: '签署方式', hideInSearch: true },
];

function request(_params: ProTableRequest) {
  return Promise.resolve({ list: [], total: 0 });
}
<\/script>

<template>
  <ProTable dragg-able row-key="id" :options="options" :request="request" :hide-form="true" />
<\/template>`;

const editCode = `<script setup lang="tsx">
import { computed, ref, useTemplateRef } from 'vue';
import { Input, MessagePlugin, Select } from 'tdesign-vue-next';
import type { ProTableInstance, ProTableOption } from '@/components/ProComponents/ProTable/types';

const proTableRef = useTemplateRef<ProTableInstance>('proTableRef');
const tableData = ref([
  { id: '1', username: '贾明', status: '启用', email: 'jia@demo.com', phone: '13800000001' },
]);
const editableRowKeys = ref<string[]>([]);

const options: ProTableOption[] = [
  {
    key: 'username',
    label: '用户名',
    hideInSearch: true,
    edit: { component: Input, showEditIcon: false, rules: [{ required: true, message: '必填' }] },
  },
  {
    key: 'status',
    label: '状态',
    hideInSearch: true,
    edit: {
      component: Select,
      showEditIcon: false,
      props: { options: [{ label: '启用', value: '启用' }, { label: '禁用', value: '禁用' }] },
    },
  },
  { key: 'action', label: '操作', hideInSearch: true },
];

function handleRowEdit(context: { rowIndex: number; editedRow: any }) {
  tableData.value.splice(context.rowIndex, 1, { ...context.editedRow });
}

const tableProps = computed(() => ({
  editableRowKeys: editableRowKeys.value,
  onRowEdit: handleRowEdit,
}));

function handleEdit(row: { id: string }) {
  editableRowKeys.value = [...editableRowKeys.value, row.id];
}

async function handleSave(row: { id: string }) {
  const table = proTableRef.value?.getTableInstance();
  const { result } = await table!.validateRowData(row.id);
  if (Array.isArray(result) && result.length > 0) return;
  editableRowKeys.value = editableRowKeys.value.filter((key) => key !== row.id);
  MessagePlugin.success('保存成功');
}

function handleCancel(row: { id: string }) {
  editableRowKeys.value = editableRowKeys.value.filter((key) => key !== row.id);
}
<\/script>

<template>
  <ProTable
    ref="proTableRef"
    v-model:data="tableData"
    :options="options"
    :hide-form="true"
    :hide-page="true"
    :table-props="tableProps"
  >
    <template #table-action="{ row }">
      <t-space v-if="!editableRowKeys.includes(row.id)">
        <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
      </t-space>
      <t-space v-else>
        <t-link theme="primary" @click="handleSave(row)">保存</t-link>
        <t-link @click="handleCancel(row)">取消</t-link>
      </t-space>
    </template>
  </ProTable>
<\/template>`;

const cardRenderCode = `<script setup lang="tsx">
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';

const options: ProTableOption[] = [
  { key: 'username', label: '用户名' },
];

function request(_params: ProTableRequest) {
  return Promise.resolve({ list: [], total: 0 });
}
<\/script>

<template>
  <ProTable :options="options" :request="request" :hide-form="true">
    <template #card="{ list }">
      <div class="user-card-grid">
        <div v-for="item in list" :key="item.id" class="user-card">
          <t-avatar :image="item.avatar" />
          <div>{{ item.username }}</div>
          <!-- 自定义卡片内容与样式 -->
        </div>
      </div>
    </template>
  </ProTable>
<\/template>`;

const hookCode = `<script setup lang="tsx">
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';
import { useProTable } from '@/hooks/components/useProTable';

const options: ProTableOption[] = [
  { key: 'username', label: '用户名' },
  { key: 'email', label: '邮箱', hideInSearch: true },
];

function request(_params: ProTableRequest) {
  return Promise.resolve({ list: [], total: 0 });
}

const { tableRef, tableProps, reload } = useProTable({
  options,
  request,
  hideForm: true,
});
<\/script>

<template>
  <ProTable ref="tableRef" v-bind="tableProps" />
<\/template>`;
</script>

<template>
    <div class="pro-table-doc">
        <aside class="pro-table-doc__anchor">
            <div class="pro-table-doc__anchor-title">本页目录</div>
            <button
                v-for="item in anchors"
                :key="item.id"
                type="button"
                class="pro-table-doc__anchor-item"
                :class="{ 'is-active': activeAnchor === item.id }"
                @click="scrollToAnchor(item.id)"
            >
                {{ item.title }}
            </button>
        </aside>

        <div class="pro-table-doc__content">
            <div class="pro-table-doc__intro">
                <h2 class="pro-table-doc__name">ProTable 高级表格</h2>
                <p class="pro-table-doc__summary">
                    基于 TDesign Table 封装，内置搜索表单、分页、列渲染、行选择、拖拽排序、行编辑等能力，默认只需配置
                    <code>options</code> 与 <code>request</code>；也可用 <code>useProTable</code> 简化写法。
                </p>
            </div>

            <DemoBlock
                id="basic"
                title="基础表格"
                description="最简单的用法"
                detail="隐藏搜索区，仅展示数据列表与分页。"
                :code="basicCode"
            >
                <BasicTable />
            </DemoBlock>

            <DemoBlock
                id="search"
                title="带搜索的表格"
                description="结合查询表单使用"
                detail="options 中未设置 hideInSearch 的字段会自动生成搜索项，支持 input / select / datePicker 等类型。"
                :code="searchCode"
                :default-expanded="false"
            >
                <SearchTable />
            </DemoBlock>

            <DemoBlock
                id="custom-render"
                title="自定义列渲染"
                description="使用 render 自定义单元格"
                detail="可通过 JSX render 渲染链接、图片、状态标签等；操作列使用 #table-action 插槽。"
                :code="customRenderCode"
                :default-expanded="false"
            >
                <CustomRenderTable />
            </DemoBlock>

            <DemoBlock
                id="select"
                title="行选择"
                description="开启多选并获取选中项"
                detail="设置 select-able，通过 v-model:select-data 获取选中行；工具栏可用 #pro-table-actions 插槽。"
                :code="selectCode"
                :default-expanded="false"
            >
                <SelectTable />
            </DemoBlock>

            <DemoBlock
                id="drag"
                title="可拖拽表格"
                description="开启行拖拽排序"
                detail="设置 dragg-able 后，左侧出现拖拽手柄，拖动即可调整行顺序。"
                :code="dragCode"
                :default-expanded="false"
            >
                <DragTable />
            </DemoBlock>

            <DemoBlock
                id="edit"
                title="编辑行"
                description="行内编辑单元格"
                detail="在 options 中配置 edit，配合 table-props.editableRowKeys 进入行编辑；操作列提供保存 / 取消，保存时调用 validateRowData。"
                :code="editCode"
                :default-expanded="false"
            >
                <EditTable />
            </DemoBlock>

            <DemoBlock
                id="card-render"
                title="自定义整块渲染"
                description="使用 #card 插槽自定义整块数据展示"
                detail="提供 #card 插槽后不再渲染 Table，可自行用卡片、列表等方式展示 list 数据，分页仍由 ProTable 托管。"
                :code="cardRenderCode"
                :default-expanded="false"
            >
                <CardRenderTable />
            </DemoBlock>

            <DemoBlock
                id="hook"
                title="使用 Hook"
                description="useProTable 配置工厂"
                detail="用 useProTable 收拢 options、request、ref 与 reload 等方法，模板通过 v-bind=&quot;tableProps&quot; 展开，与直接传 props 等价。"
                :code="hookCode"
                :default-expanded="false"
            >
                <HookTable />
            </DemoBlock>
        </div>
    </div>
</template>

<style scoped lang="scss">
.pro-table-doc {
    position: relative;
    display: flex;
    gap: 32px;
    align-items: flex-start;
    max-width: 1280px;
    margin: 0 auto;
    padding: 8px 4px 48px;
}

.pro-table-doc__content {
    flex: 1;
    min-width: 0;
    order: 1;
}

.pro-table-doc__anchor {
    position: sticky;
    top: 72px;
    flex-shrink: 0;
    order: 2;
    width: 148px;
    padding: 4px 0;
}

.pro-table-doc__anchor-title {
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
}

.pro-table-doc__anchor-item {
    display: block;
    width: 100%;
    padding: 8px 10px;
    border: 0;
    border-left: 2px solid transparent;
    border-radius: 0;
    background: transparent;
    color: var(--td-text-color-secondary);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease;

    &:hover {
        color: var(--td-brand-color);
    }

    &.is-active {
        border-left-color: var(--td-brand-color);
        color: var(--td-brand-color);
        font-weight: 500;
    }
}

.pro-table-doc__intro {
    margin-bottom: 32px;
}

.pro-table-doc__name {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--td-text-color-primary);
}

.pro-table-doc__summary {
    margin: 12px 0 0;
    font-size: 14px;
    line-height: 1.7;
    color: var(--td-text-color-secondary);

    code {
        padding: 1px 6px;
        border-radius: 4px;
        background: var(--td-bg-color-secondarycontainer);
        color: var(--td-brand-color);
        font-size: 13px;
    }
}

@media (max-width: 960px) {
    .pro-table-doc {
        flex-direction: column;
    }

    .pro-table-doc__anchor {
        position: static;
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        gap: 4px 8px;
    }

    .pro-table-doc__anchor-title {
        width: 100%;
    }

    .pro-table-doc__anchor-item {
        width: auto;
        border-left: 0;
        border-radius: 6px;
        background: var(--td-bg-color-secondarycontainer);

        &.is-active {
            background: var(--td-brand-color-light);
        }
    }
}
</style>
