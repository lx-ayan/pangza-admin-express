import useRequest from '@/hooks/core/useRequest';
import type { ProTableRequest, ProTableResult } from '@/components/ProComponents';
import type {
    CreateMockDataPoolDTO,
    GenerateMockDataVO,
    MockDataPool,
    MockDataPoolListDTO,
    MockDataPoolPageDTO,
    UpdateMockDataPoolDTO,
} from '@/types/api/mockData';

const request = useRequest('/api/mock_data', {
    wait: 300,
});

export function getMockDataPoolList(data?: MockDataPoolListDTO) {
    return request.post<MockDataPool[]>('/list', data ?? {});
}

export function getMockDataPoolPage(data: ProTableRequest<MockDataPoolPageDTO>) {
    return request.post<ProTableResult<MockDataPool>>('/page', data);
}

export function createMockDataPool(data: CreateMockDataPoolDTO) {
    return request.post('/create', data);
}

export function updateMockDataPool(data: UpdateMockDataPoolDTO) {
    return request.post('/update', data);
}

export function deleteMockDataPool(id: string) {
    return request.post(`/delete/${id}`);
}

export function getMockDataPool(id: string) {
    return request.post<MockDataPool>(`/get/${id}`);
}

export function generateMockData(name: string) {
    return request.post<GenerateMockDataVO>(`/generate/${name}`);
}
