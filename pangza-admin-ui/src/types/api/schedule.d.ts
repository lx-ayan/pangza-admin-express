export interface ScheduleTask {
    id: string;
    title: string;
    cron: string;
    beanName: string;
    description: string;
    status: number;
    createTime: string;
    updateTime: string;
}

export type CreateScheduleDTO = ExcludeAndPartial<ScheduleTask, 'id' | 'createTime' | 'updateTime'>;

export type UpdateScheduleDTO = Optional<ScheduleTask, 'description' | 'beanName' | 'status' | 'createTime' | 'updateTime'>;

export type GetSchedulePageDTO = ExcludeAndPartial<ScheduleTask, 'id' | 'description' | 'beanName' | 'createTime' | 'updateTime'>;
