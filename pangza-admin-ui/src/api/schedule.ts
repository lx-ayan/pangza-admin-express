import type { ProTableRequest, ProTableResult } from '@/components/ProComponents';
import useRequest from '@/hooks/core/useRequest';
import type { CreateScheduleDTO, GetSchedulePageDTO, ScheduleTask, UpdateScheduleDTO } from '@/types/api/schedule';

const request = useRequest('/api/schedule', {
    wait: 200,
});

export function getSchedulePage(data: ProTableRequest<GetSchedulePageDTO>) {
    return request.post<ProTableResult<ScheduleTask>>('/page', data);
}

export function getSchedule(id: string) {
    return request.post<ScheduleTask>(`/get/${id}`);
}

export function createSchedule(data: CreateScheduleDTO) {
    return request.post('/create', data);
}

export function updateSchedule(data: UpdateScheduleDTO) {
    return request.post('/update', data);
}

export function deleteSchedule(id: string) {
    return request.post(`/delete/${id}`);
}

/** 立即执行一次 */
export function runSchedule(id: string) {
    return request.post(`/run/${id}`);
}

/** 启用 / 停用 */
export function changeScheduleStatus(id: string, status: number) {
    return request.post(`/status/${id}`, { status });
}
