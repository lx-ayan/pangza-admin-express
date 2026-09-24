import type { ProTableRequest, ProTableResult } from '@/components/ProComponents';
import useRequest from '@/hooks/core/useRequest';

export interface SysConfigItem {
    id: string;
    configKey: string;
    configName: string;
    configValue?: string;
    configType?: string;
    remark?: string;
    publicFlag?: number;
    sortNum?: number;
    createTime?: string;
    updateTime?: string;
}

export interface SysConfigPageDTO {
    keyword?: string;
}

export interface UpdateSysConfigDTO {
    id: string;
    configKey?: string;
    configName?: string;
    configValue?: string;
    configType?: string;
    remark?: string;
    publicFlag?: number;
    sortNum?: number;
}

const request = useRequest('/api/sys_config', { wait: 200 });

/** 公开配置（登录前） */
export function getPublicSysConfig() {
    return request.get<Record<string, string>>('/public');
}

export function getSysConfigPage(data: ProTableRequest<SysConfigPageDTO>) {
    return request.post<ProTableResult<SysConfigItem>>('/page', data);
}

export function getSysConfigList() {
    return request.get<SysConfigItem[]>('/list');
}

export function updateSysConfig(data: UpdateSysConfigDTO) {
    return request.post('/update', data);
}

export function refreshSysConfigCache() {
    return request.post('/refresh_cache');
}
