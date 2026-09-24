import { setPiniaPersistedStateConfig } from "@/config/pinia.config";
import { defineStore } from "pinia";
import { login as userLogin, logout as userLogout } from '@/api/user';
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getUserRouter } from "@/api/menu";
import type { MenuResult } from "@/types/api/menu";
import useTabStore from "@/store/tabStore";

const useUserStore = defineStore('user', () => {

    const router = useRouter();

    const token = ref('');

    const permission = ref<string | string[]>([]);

    const userInfo = ref<Nullable<LoginResult>>();

    const menuList = ref<MenuResult[]>([]);

    function setToken(_t: string) {
        token.value = _t;
    }

    function getToken() {
        return token.value;
    }

    function setPermission(_p: string | string[]) {
        permission.value = _p;
    }

    function getPermission() {
        return permission.value;
    }

    async function login(data: LoginDTO) {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await userLogin({ ...data, platform: 'PC' })
                afterLogin(res);
                resolve(res);
            } catch (e) {
                reject(e);
            }
        })
    }

    function afterLogin(result: LoginResult) {
        setToken(result.token);
        setUserInfo(result);
        setPermission(result.permission as string[]);
        getUserRouter().then(res => {
            menuList.value = res;
            router.push('/home');
        })
    }

    function setUserInfo(result: LoginResult) {
        userInfo.value = result;
    }

    function getUserInfo() {
        return userInfo.value;
    }

    /**
     * 仅清理前端登录态（不请求后端），用于 token 失效等场景
     */
    function clearLoginState() {
        setToken('');
        permission.value = [];
        userInfo.value = null;
        menuList.value = [];
        useTabStore().closeAllTab();
    }

    /**
     * 退出登录：调用后端注销后清理本地状态并跳转登录页
     */
    async function logout() {
        try {
            if (token.value) {
                await userLogout();
            }
        } catch {
            // 后端失败时仍清理本地状态，避免卡在登录态
        } finally {
            clearLoginState();
            router.push('/login');
        }
    }

    return {
        token,
        permission,
        userInfo,
        menuList,
        setToken,
        getToken,
        setPermission,
        getPermission,
        login,
        setUserInfo,
        getUserInfo,
        clearLoginState,
        logout
    }
}, {
    persist: setPiniaPersistedStateConfig('user')
})

export default useUserStore;
