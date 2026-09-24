<script setup lang='ts'>
import type { ContextMenuOption } from '@/components/public/ContextMenu/types';
import useTabStore from '@/store/tabStore';
import { createNameSpace } from '@/utils/core/css';
import { computed, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const tabStore = useTabStore();

const tabs = createNameSpace('tag-tabs');

const router = useRouter();

const containerRef = useTemplateRef('containerRef');

const route = useRoute();

const tagRefs = useTemplateRef('tagRefs');

let currentTag = null;

const contextMenuOption = computed<ContextMenuOption[]>(() => [

    {
        content: '刷新页面',
        value: 'refresh',
    },
    {
        content: '关闭当前',
        value: 'closeCurrent',
    },
    {
        content: '关闭其他',
        value: 'closeOther',
    },
    {
        content: '关闭所有',
        value: 'closeAll',
    }

])

const actions = {
    refresh: () => {
        window.location.reload();
    },
    closeCurrent: () => {
        handleClose(currentTag);
    },
    closeOther: () => {
        tabStore.closeOtherTab(currentTag.url);
        router.push(currentTag.url);
        tabStore.setActiveTab(currentTag.url);
    },
    closeAll: () => {
        tabStore.closeAllTab();
        router.push('/home');
        tabStore.setActiveTab('/home');
    }
}

function handleClick(item: { url: string }) {
    router.push(item.url);
    tabStore.setActiveTab(item.url);
}

function handleClose(item: { url: string }) {
    const index = tabStore.tabList.findIndex(i => i.url === item.url);
    if (tabStore.activeTab === item.url) {
        const nextTab = tabStore.tabList[index + 1] || tabStore.tabList[index - 1];
        if (nextTab) {
            router.push(nextTab.url);
            tabStore.setActiveTab(nextTab.url);
        } else {
            router.push('/home');
            tabStore.setActiveTab('/home');
        }
    }
    tabStore.closeTab(item.url);
}

function toLeft() {
    if (tabStore.tabList && tabStore.tabList.length) {
        if (clickIndex.value > 0) {
            const url = tabStore.tabList[clickIndex.value - 1].url;
            router.push(url);
            tabStore.setActiveTab(url);
        }
        containerRef.value.scrollLeft -= (tagRefs.value[clickIndex.value].clientWidth) + 8;
    }
}

function toRight() {
    if (tabStore.tabList && tabStore.tabList.length) {
        if (clickIndex.value < tabStore.tabList.length - 1) {
            const url = tabStore.tabList[clickIndex.value + 1].url;
            router.push(url);
            tabStore.setActiveTab(url);
        }
        containerRef.value.scrollLeft += (tagRefs.value[clickIndex.value].clientWidth) + 8;
    }
}

function handleChoose(value: typeof contextMenuOption.value[number]['value']) {
    actions[value]();
}

const clickIndex = computed(() => {
    return tabStore.tabList.findIndex(tab => tab.url == route.fullPath);
});


</script>
<template>
    <div :class="tabs.getName()">
        <IContextMenu @choose="handleChoose" :options="contextMenuOption">
            <div :class="tabs.e('box')">
                <div @click="toLeft" :class="createNameSpace(tabs.e('box')).b('left')">
                    <MyIcon :size="16" name="ChevronLeft" />
                </div>
                <div ref="containerRef" :class="createNameSpace(tabs.e('box')).b('center')">
                    <div ref="tagRefs" @contextmenu="currentTag = item" @click="() => handleClick(item)"
                        :class="createNameSpace(createNameSpace(tabs.e('box')).b('center')).e('item')"
                        v-for="item in tabStore.tabList" :key="item.url">
                        <span :class="{ 'text-[var(--td-brand-color)]': tabStore.activeTab === item.url }">
                            {{ item.title }}
                        </span>

                        <span @click.stop="() => handleClose(item)" class="ml-3" v-if="item.closeable">
                            <MyIcon :size="14"
                                :color="tabStore.activeTab === item.url ? 'var(--td-brand-color)' : undefined"
                                name="X" />
                        </span>
                    </div>
                </div>
                <div :class="createNameSpace(tabs.e('box')).b('right')">
                    <div @click="toRight">
                        <MyIcon :size="16" name="ChevronRight" />
                    </div>
                </div>
            </div>
        </IContextMenu>
    </div>
</template>

<style lang="scss">
@use '@/assets/css/base.scss' as *;

@mixin tabs-action {
    @include card-bg-color;
    @include flex-column-center;
    @apply mx-1 p-2 h-full rounded-sm cursor-pointer;
}

.tag-tabs {
    width: 100%;
    scroll-behavior: smooth;
    @apply mb-3 h-[32px];


    &__box {
        @include flex-column-center;
        @apply h-full w-full shrink-0 select-none;
        overflow: auto;

        &-left {
            @include tabs-action;
        }

        &-center {
            @include flex-column-center;
            min-width: 0;


            @apply h-full mx-1 flex-1 overflow-hidden;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;

            &::-webkit-scrollbar {
                display: none;
            }

            &__item {
                @include card-bg-color;
                @include flex-column-center;
                @apply h-full mr-2 px-3 p-2 rounded-sm whitespace-nowrap cursor-pointer;
            }
        }

        &-right {
            @include tabs-action;
            @apply px-4;
        }
    }
}
</style>