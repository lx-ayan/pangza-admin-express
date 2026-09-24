import useRequest from '@/hooks/core/useRequest';
import type { ProTableRequest, ProTableResult } from '@/components/ProComponents';
import type {
    CreateTableConfigDTO,
    TableConfig,
    TableConfigListDTO,
    TableConfigPageDTO,
    UpdateTableConfigDTO,
} from '@/types/api/tableConfig';

const request = useRequest('/api/table_config', {
    wait: 300,
});

/** 获取库表配置列表 */
export function getTableConfigList(data?: TableConfigListDTO) {
    return request.post<TableConfig[]>('/list', data ?? {});
}

/** 获取库表配置分页 */
export function getTableConfigPage(data: ProTableRequest<TableConfigPageDTO>) {
    return request.post<ProTableResult<TableConfig>>('/page', data);
}

/** 创建库表配置 */
export function createTableConfig(data: CreateTableConfigDTO) {
    return request.post('/create', data);
}

/** 更新库表配置 */
export function updateTableConfig(data: UpdateTableConfigDTO) {
    return request.post('/update', data);
}

/** 删除库表配置 */
export function deleteTableConfig(id: string) {
    return request.post(`/delete/${id}`);
}

/** 获取库表配置详情 */
export function getTableConfig(id: string) {
    return request.post<TableConfig>(`/get/${id}`);
}
