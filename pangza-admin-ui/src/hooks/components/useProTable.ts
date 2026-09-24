import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';
import type {
    ProTableInstance,
    ProTableOption,
    ProTableProps,
    ProTableRequest,
    ProTableResult,
} from '@/components/ProComponents/ProTable/types';

/** useProTable 配置：与 ProTableProps 对齐，options 等支持响应式 */
export interface UseProTableOptions<T = any> {
    /** 列 / 搜索项配置 */
    options: MaybeRefOrGetter<ProTableOption<T>[]>;
    /** 静态数据（不走 request 时） */
    data?: MaybeRefOrGetter<any[] | undefined>;
    /** 列表请求 */
    request?: (data: ProTableRequest) => ProTableResult | Promise<ProTableResult>;
    /** 搜索表单额外 props */
    formProps?: MaybeRefOrGetter<ProTableProps['formProps']>;
    /** 隐藏搜索表单 */
    hideForm?: MaybeRefOrGetter<boolean | undefined>;
    /** 隐藏分页 */
    hidePage?: MaybeRefOrGetter<boolean | undefined>;
    /** 开启拖拽 */
    draggAble?: MaybeRefOrGetter<boolean | undefined>;
    /** 开启行选择 */
    selectAble?: MaybeRefOrGetter<boolean | undefined>;
    /** 透传给 TDesign Table */
    tableProps?: MaybeRefOrGetter<ProTableProps['tableProps']>;
    /** 行主键 */
    rowKey?: MaybeRefOrGetter<string | undefined>;
    /** 选择类型 */
    selectType?: MaybeRefOrGetter<ProTableProps['selectType']>;
    /** 分页 props */
    pageProps?: MaybeRefOrGetter<ProTableProps['pageProps']>;
}

/**
 * ProTable 配置工厂：收拢 options / request / ref 与常用方法，模板 v-bind 展开即可
 */
function useProTable<T = any>(config: UseProTableOptions<T>) {
    const tableRef = ref<ProTableInstance>();

    /** 行选择数据，配合 v-model:select-data */
    const selectData = ref<{ values?: Array<string | number> }>({ values: undefined });

    /** 可直接 v-bind 到 ProTable 的 props */
    const tableProps = computed(() => ({
        options: toValue(config.options),
        data: toValue(config.data),
        request: config.request,
        formProps: toValue(config.formProps),
        hideForm: toValue(config.hideForm),
        hidePage: toValue(config.hidePage),
        draggAble: toValue(config.draggAble),
        selectAble: toValue(config.selectAble),
        tableProps: toValue(config.tableProps),
        rowKey: toValue(config.rowKey),
        selectType: toValue(config.selectType),
        pageProps: toValue(config.pageProps),
    }));

    /** 重新加载列表（重置搜索条件后请求） */
    function reload() {
        tableRef.value?.reload();
    }

    /** 重置搜索表单并刷新 */
    function reset() {
        tableRef.value?.reset();
    }

    /** 获取搜索表单值 */
    function getFormValue() {
        return tableRef.value?.getFormValue();
    }

    /** 获取内置 ProForm 实例 */
    function getFormInstance() {
        return tableRef.value?.getFormInstance();
    }

    /** 获取 TDesign Table 实例 */
    function getTableInstance() {
        return tableRef.value?.getTableInstance();
    }

    /** 校验表格编辑数据 */
    function validate() {
        return tableRef.value?.validate();
    }

    /** 清除表格校验 */
    function clearValidate() {
        return tableRef.value?.clearValidate();
    }

    return {
        tableRef,
        tableProps,
        selectData,
        reload,
        reset,
        getFormValue,
        getFormInstance,
        getTableInstance,
        validate,
        clearValidate,
    };
}

export default useProTable;
export { useProTable };
