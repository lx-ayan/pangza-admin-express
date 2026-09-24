export interface MockDataPool {
    id: string;
    name: string;
    description: string;
    dataContent: string;
    sortNum?: number;
}

export type CreateMockDataPoolDTO = ExcludeAndPartial<MockDataPool, 'id'>;

export type UpdateMockDataPoolDTO = MockDataPool;

export interface MockDataPoolListDTO {
    keyword?: string;
}

export interface MockDataPoolPageDTO {
    keyword?: string;
}

export interface GenerateMockDataVO {
    name: string;
    value: string;
}
