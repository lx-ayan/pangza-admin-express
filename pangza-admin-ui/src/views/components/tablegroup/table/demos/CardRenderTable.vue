<script setup lang="tsx">
import type { ProTableOption, ProTableRequest } from '@/components/ProComponents/ProTable/types';

const options: ProTableOption[] = [
    { key: 'username', label: '用户名' },
    { key: 'status', label: '状态', hideInSearch: true },
];

/**
 * 模拟卡片列表数据
 */
function request(_params: ProTableRequest) {
    const list = Array.from({ length: 6 }).map((_, i) => ({
        id: String(i + 1),
        username: ['贾明', '张三', '王芳', '李雷', '韩梅', '赵六'][i],
        role: ['区域经理', '渠道专员', '客户顾问', '运营主管', '销售经理', '产品经理'][i],
        status: i % 2 === 0 ? '启用' : '禁用',
        email: `user${i + 1}@demo.com`,
        phone: `138${String(10000000 + i).slice(0, 8)}`,
        address: ['北京', '上海', '广州', '深圳', '杭州', '成都'][i],
        avatar: [
            'https://tdesign.gtimg.com/demo/demo-image-1.png',
            'https://tdesign.gtimg.com/demo/demo-image-2.png',
            'https://tdesign.gtimg.com/demo/demo-image-3.png',
        ][i % 3],
        dept: ['华北事业部', '华东事业部', '华南事业部', '西部事业部', '中部事业部', '总部'][i],
        desc: [
            '负责华北区域客户拓展与重点项目跟进，协调跨部门资源落地。',
            '维护华东渠道合作伙伴关系，跟进签约与续约进度。',
            '服务华南核心客户，处理日常咨询与售后协同。',
            '统筹西部运营指标，优化活动转化与留存。',
            '推进中部销售目标拆解，支持一线团队达成业绩。',
            '规划产品迭代节奏，对齐业务与研发交付计划。',
        ][i],
    }));
    return Promise.resolve({ list, total: list.length });
}
</script>

<template>
    <ProTable :options="options" :request="request" :hide-form="true">
        <template #pro-table-title>使用 #card 插槽自定义整块列表</template>
        <template #card="{ list }">
            <div class="user-card-grid">
                <div v-for="item in list" :key="item.id" class="user-card">
                    <div class="user-card__header">
                        <div class="user-card__title-wrap">
                            <t-avatar size="40px" :image="item.avatar" />
                            <div class="user-card__title-text">
                                <div class="user-card__title-row">
                                    <span class="user-card__title">{{ item.username }}</span>
                                    <span
                                        v-if="item.status === '启用'"
                                        class="user-card__badge"
                                    >
                                        <MyIcon name="CircleCheck" :size="12" />
                                        已启用
                                    </span>
                                </div>
                                <div class="user-card__subtitle">{{ item.role }} · {{ item.dept }}</div>
                            </div>
                        </div>
                    </div>

                    <p class="user-card__desc">{{ item.desc }}</p>

                    <div class="user-card__meta">
                        <span>{{ item.address }}</span>
                        <span>{{ item.email }}</span>
                    </div>

                    <div class="user-card__footer">
                        <t-button size="medium" variant="outline">查看详情</t-button>
                        <t-button size="medium" theme="primary">编辑</t-button>
                    </div>
                </div>
            </div>
        </template>
    </ProTable>
</template>

<style scoped lang="scss">
.user-card-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
}

.user-card {
    display: flex;
    flex-direction: column;
    min-height: 220px;
    padding: 20px;
    border: 1px solid var(--td-component-border);
    border-radius: 10px;
    background: var(--td-bg-color-container);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
        border-color: color-mix(in srgb, var(--td-brand-color) 28%, var(--td-component-border));
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
    }
}

.user-card__header {
    margin-bottom: 12px;
}

.user-card__title-wrap {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
}

.user-card__title-text {
    min-width: 0;
    flex: 1;
}

.user-card__title-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
}

.user-card__title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--td-text-color-primary);
}

.user-card__badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--td-success-color) 12%, transparent);
    color: var(--td-success-color);
    font-size: 12px;
    line-height: 18px;
}

.user-card__subtitle {
    margin-top: 4px;
    font-size: 13px;
    color: var(--td-text-color-secondary);
}

.user-card__desc {
    flex: 1;
    margin: 0;
    font-size: 13px;
    line-height: 1.7;
    color: var(--td-text-color-secondary);
}

.user-card__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-top: 14px;
    font-size: 12px;
    color: var(--td-text-color-placeholder);
}

.user-card__footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 18px;
}

@media (max-width: 1100px) {
    .user-card-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 720px) {
    .user-card-grid {
        grid-template-columns: 1fr;
    }
}
</style>
