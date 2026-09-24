<script setup lang='ts'>
import { computed, ref } from 'vue';
import { MessagePlugin, type UploadFile } from 'tdesign-vue-next';
import useUserStore from '@/store/userStore';
import { updateProfile } from '@/api/user';
import { uploadFiles } from '@/api/file';

const userStore = useUserStore();

const visible = ref(false);
const saving = ref(false);
const activeTab = ref<'upload' | 'link'>('upload');
const uploadedUrl = ref('');
const linkUrl = ref('');
const uploadFilesList = ref<UploadFile[]>([]);

const displayName = computed(() => {
    const info = userStore.getUserInfo();
    return info?.nickName || info?.username || '';
});

const avatar = computed(() => userStore.getUserInfo()?.avatar || '');

const previewUrl = computed(() => {
    if (activeTab.value === 'upload') {
        return uploadedUrl.value || avatar.value;
    }
    return linkUrl.value || avatar.value;
});

/**
 * 打开上传头像弹窗
 */
function openDialog() {
    activeTab.value = 'upload';
    uploadedUrl.value = '';
    linkUrl.value = avatar.value || '';
    uploadFilesList.value = [];
    visible.value = true;
}

/**
 * 切换上传 / 链接方式
 */
function switchTab(tab: 'upload' | 'link') {
    activeTab.value = tab;
}

/**
 * 选择本地图片后上传到 avatar 桶
 */
async function handleUpload(file: UploadFile) {
    const raw = file.raw;
    if (!raw) {
        return false;
    }
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(raw.type)) {
        MessagePlugin.warning('仅支持 PNG 或 JPG 图片');
        return false;
    }
    if (raw.size > 5 * 1024 * 1024) {
        MessagePlugin.warning('图片大小不能超过 5MB');
        return false;
    }
    try {
        const list = await uploadFiles('avatar', raw);
        if (list?.[0]?.data) {
            uploadedUrl.value = list[0].data;
            uploadFilesList.value = [{
                ...file,
                status: 'success',
                url: list[0].data,
            }];
            MessagePlugin.success('上传成功，请点击确定保存');
        }
    } catch (e: any) {
        MessagePlugin.error(e || '上传失败');
    }
    return false;
}

/**
 * 保存头像（上传文件或填写链接，二选一）
 */
async function handleConfirm() {
    const url = (activeTab.value === 'upload' ? uploadedUrl.value : linkUrl.value)?.trim();
    if (!url) {
        MessagePlugin.warning(activeTab.value === 'upload' ? '请先上传图片' : '请填写头像链接');
        return false;
    }
    saving.value = true;
    try {
        const user = await updateProfile({ avatar: url });
        const info = userStore.getUserInfo();
        if (info) {
            userStore.setUserInfo({
                ...info,
                avatar: user.avatar,
                nickName: user.nickName || info.nickName,
            });
        }
        MessagePlugin.success('头像更新成功');
        return true;
    } catch (e: any) {
        MessagePlugin.error(e || '头像更新失败');
        return false;
    } finally {
        saving.value = false;
    }
}
</script>
<template>
    <t-card :bordered="false">
        <div class="flex items-center">
            <div>
                <t-avatar :imageProps="{fit: 'fill'}" size="48px" :image="avatar"></t-avatar>
            </div>
            <div class="ml-4 flex-1">
                <div class="text-[#16192C] dark:text-white text-base font-normal">
                    {{ displayName }}
                </div>
                <div class="text-[#425466] dark:text-white/40 text-[13px]">
                    请上传 PNG 或 JPG 图片，图片大小不超过 5MB。
                </div>
            </div>
            <div>
                <t-button variant="text" @click="openDialog">
                    <template #icon>
                        <MyIcon size="16" class="mr-1" name="CloudUpload" />
                    </template>
                    上传头像
                </t-button>
            </div>
        </div>
    </t-card>

    <t-dialog
        v-model:visible="visible"
        header="上传头像"
        :confirm-btn="{ content: '确定', loading: saving }"
        :on-confirm="handleConfirm"
        width="420px"
    >
        <div class="avatar-upload">
            <div class="avatar-upload__preview">
                <t-avatar size="88px" :image="previewUrl"></t-avatar>
                <p class="avatar-upload__hint">支持 PNG / JPG，不超过 5MB</p>
            </div>

            <div class="avatar-upload__switch" role="tablist">
                <button
                    type="button"
                    role="tab"
                    class="avatar-upload__switch-item"
                    :class="{ 'is-active': activeTab === 'upload' }"
                    :aria-selected="activeTab === 'upload'"
                    @click="switchTab('upload')"
                >
                    上传文件
                </button>
                <button
                    type="button"
                    role="tab"
                    class="avatar-upload__switch-item"
                    :class="{ 'is-active': activeTab === 'link' }"
                    :aria-selected="activeTab === 'link'"
                    @click="switchTab('link')"
                >
                    填写链接
                </button>
            </div>

            <div class="avatar-upload__panel">
                <t-upload
                    v-if="activeTab === 'upload'"
                    v-model="uploadFilesList"
                    theme="custom"
                    accept="image/png,image/jpeg,image/jpg"
                    :auto-upload="false"
                    :max="1"
                    :before-upload="handleUpload"
                >
                    <div class="avatar-upload__drop">
                        <MyIcon size="22" name="CloudUpload" class="avatar-upload__drop-icon" />
                        <div class="avatar-upload__drop-title">点击选择图片</div>
                        <div class="avatar-upload__drop-desc">PNG / JPG，大小不超过 5MB</div>
                    </div>
                </t-upload>

                <t-input
                    v-else
                    v-model="linkUrl"
                    clearable
                    placeholder="粘贴图片链接，如 https://..."
                    size="large"
                />
            </div>
        </div>
    </t-dialog>
</template>

<style scoped lang="scss">
.avatar-upload {
    padding: 4px 4px 8px;
}

.avatar-upload__preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.avatar-upload__hint {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--td-text-color-placeholder);
}

.avatar-upload__switch {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 4px;
    margin-bottom: 16px;
    border-radius: 10px;
    background: var(--td-bg-color-secondarycontainer);
}

.avatar-upload__switch-item {
    height: 34px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--td-text-color-secondary);
    font-size: 13px;
    line-height: 34px;
    cursor: pointer;
    transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;

    &:hover:not(.is-active) {
        color: var(--td-text-color-primary);
    }

    &.is-active {
        color: var(--td-text-color-primary);
        background: var(--td-bg-color-container);
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    }
}

.avatar-upload__panel {
    min-height: 108px;
}

.avatar-upload__drop {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    min-height: 108px;
    padding: 20px 16px;
    border: 1px dashed var(--td-component-border);
    border-radius: 12px;
    background: var(--td-bg-color-container);
    color: var(--td-text-color-secondary);
    cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;

    &:hover {
        border-color: var(--td-brand-color);
        background: var(--td-brand-color-light);
        color: var(--td-brand-color);
    }
}

.avatar-upload__drop-icon {
    opacity: 0.85;
}

.avatar-upload__drop-title {
    font-size: 14px;
    font-weight: 500;
    color: inherit;
}

.avatar-upload__drop-desc {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
}

:deep(.t-upload) {
    width: 100%;
}

:deep(.t-upload__trigger) {
    width: 100%;
}
</style>
