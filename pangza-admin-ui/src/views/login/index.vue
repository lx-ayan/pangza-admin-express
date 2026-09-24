<script setup lang='ts'>
import { createNameSpace } from '@/utils/core/css';
import { User, TrendingUp, Shield, BarChart3 } from 'lucide-vue-next';
import LoginForm from './components/LoginForm/index.vue';
const name = createNameSpace('login');

</script>
<template>
    <div :class="name.e('container')">
        <div :class="name.e('container-left')">
            <div class="relative z-20 flex flex-col justify-between p-12 text-white w-full">
                <div class="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/90 z-10" />
                <img class="absolute inset-0 w-full h-full object-cover opacity-20"
                    src="https://images.unsplash.com/photo-1600376691342-236eab114592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG9mZmljZSUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NjE2NDQ5MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="">
                <div>
                    <div class="flex items-center gap-2 mb-12">
                        <div
                            class="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm  flex items-center justify-center">
                            <BarChart3 class="size-7" />
                        </div>
                        <span class="text-2xl">管理后台</span>
                    </div>

                    <div class="max-w-lg space-y-6">
                        <h1 class="text-white">
                            为现代企业打造的强大工具
                        </h1>
                        <p class="text-white/80 text-lg">
                            通过我们全面的管理系统简化您的运营流程。
                            实时监控、分析和优化您的业务流程。
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-4 max-w-2xl">
                    <div class="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <User class="size-8 mb-3" />
                        <div class="text-sm text-white/60">用户管理</div>
                    </div>
                    <div class="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <TrendingUp class="size-8 mb-3" />
                        <div class="text-sm text-white/60">快速开发</div>
                    </div>
                    <div class="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <Shield class="size-8 mb-3" />
                        <div class="text-sm text-white/60">权限控制</div>
                    </div>
                </div>
            </div>
        </div>
        <div :class="name.e('container-right')">
            <div :class="name.e('container-right-box')">
                <div class="lg:hidden flex items-center gap-2 mb-8 justify-center">
                    <div class="w-10 h-10 rounded-lg bg-[var(--td-brand-color)] flex items-center justify-center">
                        <BarChart3 class="size-6 text-white" />
                    </div>
                    <span class="text-2xl text-foreground">管理后台</span>
                </div>
                <LoginForm />
            </div>

        </div>
    </div>
</template>

<style lang="scss" scoped>
.login__container {
    @apply min-h-screen flex;

    &-left {
        @apply hidden lg:flex lg:w-1/2 bg-[var(--td-brand-color)] relative overflow-hidden;
    }

    &-right {
        @apply flex-1 flex items-center justify-center p-8 bg-white;

        &-box {
            @apply w-full max-w-md;
        }
    }
}
</style>