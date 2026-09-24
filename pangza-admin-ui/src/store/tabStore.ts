import { setPiniaPersistedStateConfig } from "@/config/pinia.config";
import { defineStore } from "pinia";
import { ref } from "vue";

interface Tab {
    title: string;
    url: string;
    closeable?: boolean;
}

const DEFAULT_TAB: Tab[] = [
    {
        title: '仪表盘',
        url: '/home',
        closeable: false
    }
]

const useTabStore = defineStore('tabStore', () => {

    const activeTab = ref<string>('/home');

    const tabList = ref([...DEFAULT_TAB]);

    function closeAllTab() {
        tabList.value = [...DEFAULT_TAB];
    }

    function addTab(tab: Tab) {
        const exists = tabList.value.find(item => item.url === tab.url);
        if (!exists) {
            tabList.value.push(tab);
        }
    }

    function closeTab(url: string) {
        tabList.value = tabList.value.filter(tab => tab.url !== url);
    }

    function setActiveTab(url: string) {
        activeTab.value = url;
    }

    function closeOtherTab(url: string) {
        tabList.value = tabList.value.filter(tab => tab.url === url || tab.closeable === false);
    }

    return {
        activeTab,
        tabList,
        closeAllTab,
        addTab,
        closeTab,
        setActiveTab,
        closeOtherTab
    }
}, {
    persist: setPiniaPersistedStateConfig('tab')
});

export default useTabStore;