<script setup lang='ts'>
import { computed, ref } from 'vue';
import TablePropsButton from '@/components/business/TablePropsButton/index.vue';
import TableOptionButton from '@/components/business/TableOptionButton/index.vue';
import TableSizeButton from '@/components/business/TableSizeButton/index.vue';
import TableShowSearchButton from '@/components/business/TableShowSearchButton/index.vue';
import ArticleCard from './components/ArticleCard/index.vue';
import { useRouter } from 'vue-router';
import useTabStore from '@/store/tabStore';
import type { ProTableOption } from '@/components/ProComponents/ProTable/types';

const tabStore = useTabStore();

const router = useRouter();

const tableMode = ref('1');

const tableData = ref([
    {
        title: "Vue3 中自定义组件的最佳实践",
        author: "张前端",
        viewNum: 2568,
        likeNum: 156,
        commentNum: 42,
        createTime: "2025-01-15 10:23:45",
        poster: 'https://images.pexels.com/photos/2176729/pexels-photo-2176729.jpeg'
    },
    {
        title: "React Hooks 从入门到精通",
        author: "李React",
        viewNum: 3892,
        likeNum: 218,
        commentNum: 76,
        createTime: "2025-02-20 14:15:30",
        poster: 'https://images.pexels.com/photos/2286895/pexels-photo-2286895.jpeg',
    },
    {
        title: "提升前端性能：JavaScript 代码优化的10个技巧",
        author: "王性能",
        viewNum: 1987,
        likeNum: 95,
        commentNum: 31,
        createTime: "2025-03-08 09:40:12",
        poster: 'https://images.pexels.com/photos/395198/pexels-photo-395198.jpeg'
    },
    {
        title: "TypeScript 在大型项目中的应用与类型设计",
        author: "赵类型",
        viewNum: 4251,
        likeNum: 289,
        commentNum: 89,
        createTime: "2025-04-12 16:05:55",
        poster: 'https://images.pexels.com/photos/2301172/pexels-photo-2301172.jpeg'
    },
    {
        title: "现代前端工程化：从脚手架到CI/CD的完整流程",
        author: "孙工程",
        viewNum: 3672,
        likeNum: 205,
        commentNum: 67,
        createTime: "2025-05-25 11:30:28",
        poster: 'https://images.pexels.com/photos/2084338/pexels-photo-2084338.jpeg',
    },
    {
        title: "微信小程序性能优化与跨端开发实践",
        author: "周小程序",
        viewNum: 2845,
        likeNum: 142,
        commentNum: 48,
        createTime: "2025-06-18 15:22:40",
        poster: 'https://images.pexels.com/photos/395196/pexels-photo-395196.jpeg'
    },
    {
        title: "CSS Grid 与 Flex 布局的结合使用技巧",
        author: "吴样式",
        viewNum: 1753,
        likeNum: 87,
        commentNum: 26,
        createTime: "2025-07-05 10:15:19",
        poster: 'https://images.pexels.com/photos/620337/pexels-photo-620337.jpeg'
    },
    {
        title: "Node.js 搭建高性能后端服务的核心要点",
        author: "郑后端",
        viewNum: 3128,
        likeNum: 176,
        commentNum: 59,
        createTime: "2025-08-22 13:45:33",
        poster: 'https://images.pexels.com/photos/1106416/pexels-photo-1106416.jpeg',
    },
    {
        title: "前端开发中常见的安全漏洞与防护措施",
        author: "冯安全",
        viewNum: 2467,
        likeNum: 131,
        commentNum: 44,
        createTime: "2025-09-10 08:50:05",
        poster: 'https://cdn.pixabay.com/photo/2016/09/19/07/01/lake-1679708_1280.jpg'
    },
    {
        title: "ECharts 与 AntV 对比：企业级可视化方案选择",
        author: "陈可视化",
        viewNum: 3015,
        likeNum: 168,
        commentNum: 62,
        createTime: "2025-10-01 17:08:21",
        poster: 'https://cdn.pixabay.com/photo/2021/01/29/14/58/lake-5961239_1280.jpg'
    }
]);

const hideForm = ref(false);
const tablePropsButton = ref<string[]>([]);
const size = ref('medium');

const proTableOptions = ref<ProTableOption[]>([

    {
        key: 'keyword',
        label: '关键字',
        formProps: {
            placeholder: '请输入关键字搜索'
        },
        hideInTable: true
    },
    {
        key: 'title',
        label: '文章标题',
        hideInSearch: true,
        tableProps: {
            width: 360
        }
    },
    {
        key: 'author',
        label: '作者',
        hideInSearch: true
    },
    {
        key: 'viewNum',
        label: '浏览数量',
        hideInSearch: true
    },
    {
        key: 'likeNum',
        label: '点赞数量',
        hideInSearch: true
    },
    {
        key: 'commentNum',
        label: '评论数量',
        hideInSearch: true
    },
    {
        key: 'createTime',
        label: '发布时间'
    }
]);

function handleCreate() {
    const url = '/article/create';

    router.push(url).then(() => {
        tabStore.addTab({
            title: '发布文章',
            url,
            closeable: true
        });
        tabStore.activeTab = url;
    })
}

const tableProps = computed(() => ({
    bordered: tablePropsButton.value.includes('border'),
    stripe: tablePropsButton.value.includes('stripe'),
    hover: tablePropsButton.value.includes('hover'),
    size: size.value
}))
</script>
<template>
    <div>
        <ProTable :hideForm :tableProps="{ size: 'small', ...tableProps }" :options="proTableOptions"
            v-model:data="tableData">
            <template #pro-table-title>
                <t-button @click="handleCreate">发布文章</t-button>
            </template>
            <template #pro-table-actions>
                <t-space>
                    <t-radio-group v-model="tableMode" variant="default-filled" default-value="1">
                        <t-radio-button value="1">列表模式</t-radio-button>
                        <t-radio-button value="2">卡片模式</t-radio-button>
                    </t-radio-group>
                    <TableOptionButton v-model="proTableOptions" />
                    <TableSizeButton v-model="size" />
                    <TablePropsButton v-model="tablePropsButton" />
                    <TableShowSearchButton v-model="hideForm" />
                </t-space>
            </template>

            <template v-if="tableMode !== '1'" #card="{ list }">
                <Grid :gap="8" :cols="4">
                    <ArticleCard :data="item" v-for="item in list">

                    </ArticleCard>
                </Grid>
            </template>
        </ProTable>
    </div>
</template>