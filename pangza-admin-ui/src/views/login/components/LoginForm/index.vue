<script setup lang='tsx'>
import { Lock } from 'lucide-vue-next';
import { ref } from 'vue';
import { MessagePlugin } from 'tdesign-vue-next';
import useUserStore from '@/store/userStore';
import { useDebounce } from '@/hooks/core/useDebounce';
import type { ProFormOption } from '@/components/ProComponents/ProForm/types';

const userStore = useUserStore();

const loading = ref(false);

const [submit] = useDebounce(async (data: LoginDTO) => {
    try {
        await userStore.login(data);
        loading.value = false;
    } finally {
        loading.value = false;
    }
}, 3000, { immediate: false });


const options = ref<ProFormOption[]>([
    {
        name: 'username',
        placeholder: '用户名输入 admin 或 user',
        rules: [
            { required: true, message: '用户名输入 admin 或 user' }
        ],
        gridProps: {
            colSpan: 24
        },
        props: {
            formProps: {
                labelAlign: 'top',
                labelWidth: 0,
            },
            inputProps: {
                size: 'large'
            }
        }
    },
    {
        name: 'password',
        placeholder: '密码任意输入即可',
        rules: [
            { required: true, message: '请输入密码' }
        ],
        gridProps: {
            colSpan: 24
        },
        props: {
            formProps: {
                labelAlign: 'top',
                labelWidth: 0,
            },
            inputProps: {
                size: 'large',
                type: 'password'
            }
        }
    }
]);

function handleSuccess() {
    MessagePlugin.success('登录成功');
}

function handleFail() {
    MessagePlugin.error('登录失败');
}

function handleSubmit(data: LoginDTO) {
    loading.value = true;
    submit(data);
}

</script>
<template>
    <div class="w-full max-w-md space-y-8 ">
        <div class="space-y-2">
            <div class=" flex items-center gap-2 mb-6">
                <div class="w-10 h-10 rounded-lg bg-[var(--td-brand-color)] flex items-center justify-center">
                    <Lock class="size-6 text-white" />
                </div>
                <span class="text-2xl text-[#0B1133]">后台管理系统</span>
            </div>
            <h1 class="text-[#0B1133]">欢迎回来</h1>
            <p class="text-[#717182]">请输入您的账号信息登录系统</p>
        </div>
        <ProForm ref="proFormRef" :success="handleSuccess" :fail="handleFail" :submit="handleSubmit" :options="options">
            <template #extra>
                <GridItem :colSpan="24">
                    <t-button :loading type="submit" size="large" block>登录</t-button>
                </GridItem>
            </template>
        </ProForm>
        <div class="text-center">
            <p class="text-sm text-muted-foreground">
                还没有账号？
                <button type="button" class="text-primary hover:underline">
                    立即注册
                </button>
            </p>
        </div>
    </div>
</template>