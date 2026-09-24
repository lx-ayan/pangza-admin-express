<script setup lang='tsx'>
const commemtList = [
    {
        avatar: 'https://images.unsplash.com/photo-1614808252127-9d6bd0020b51?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: '薛之谦',
        datetime: '今天 08:59',
        content: '人类用沙，想捏出梦里通天塔，为贪念不惜代价。'
    },
    {
        avatar: 'https://images.unsplash.com/photo-1574504500022-de9a6309a501?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: '毛不易',
        datetime: '今天 08:59',
        content: '一杯敬自由，一杯敬死亡。宽恕我的平凡，驱散了迷惘。'
    },
    {
        avatar: 'https://images.unsplash.com/photo-1718928376182-8c195bab294f?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: '王心凌',
        datetime: '今天 08:59',
        content: 'Oh, Baby 情话多说一点，想我就多看一眼。'
    },
    {
        avatar: 'https://images.unsplash.com/photo-1613798518288-2e2ae91220ea?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: '刘惜君',
        datetime: '今天 08:59',
        content: '我也不会难过，你别太小看我。'
    },
    {
        avatar: 'https://images.unsplash.com/photo-1599493891822-62c769e6530e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        author: '韩红',
        datetime: '今天 08:59',
        content: '那是一条神奇的天路唉，把人间的温暖送到边疆。'
    }
]
</script>

<template>
    <GridItem :colSpan="12">
        <t-card style="height: 486px;" :bordered="false" title="评价">
            <t-list :split="true">
                <t-list-item v-for="item in commemtList">
                    <div>
                        <t-comment :avatar="item.avatar" :author="item.author" :datetime="item.datetime"
                            :content="item.content" />
                    </div>
                </t-list-item>
            </t-list>
        </t-card>
    </GridItem>
</template>