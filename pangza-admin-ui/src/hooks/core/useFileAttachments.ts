import { ref } from 'vue';

import { MessagePlugin, type UploadFile } from 'tdesign-vue-next';

import { uploadFiles as uploadFilesApi, type FileUploadResult } from '@/api/file';



/** 单文件大小上限：20MB */

const MAX_FILE_SIZE = 20 * 1024 * 1024;



/** 表单中持久化的附件结构（与上传接口返回字段对齐） */

type FileAttachment = Pick<FileUploadResult, 'name' | 'type' | 'data'>;



/**

 * 附件上传通用逻辑，配合 TDesign Upload 使用

 * @param bucket 上传桶名，如 task-audit、avatar

 */

export function useFileAttachments(bucket: string) {

    /** 绑定到 Upload 组件 v-model 的文件列表 */

    const uploadFiles = ref<UploadFile[]>([]);



    /** 选择文件前的校验（大小、raw 是否存在） */

    function beforeUpload(file: UploadFile) {

        if (!file.raw) {

            return false;

        }

        if (file.raw.size > MAX_FILE_SIZE) {

            MessagePlugin.warning('单个文件不能超过 20MB');

            return false;

        }

        return true;

    }



    /** 获取文件预览地址，优先取 url，其次取上传响应中的 url */

    function getFilePreviewUrl(file: UploadFile) {

        return file.url || (file.response as { url?: string } | undefined)?.url || '';

    }



    /**

     * 自定义上传请求，供 Upload 的 request-method 使用

     * 单文件返回 { response: { url } }，多文件返回 { response: { files } }

     */

    async function uploadRequest(input: UploadFile | UploadFile[]) {

        const fileList = Array.isArray(input) ? input : [input];



        try {

            const processedFiles = await Promise.all(fileList.map(async (file) => {

                const raw = file.raw;

                if (!raw) {

                    throw new Error('文件无效');

                }

                if (raw.size > MAX_FILE_SIZE) {

                    throw new Error('单个文件不能超过 20MB');

                }

                const results = await uploadFilesApi(bucket, raw);

                const result = results?.[0];

                if (!result?.data) {

                    throw new Error('文件上传失败');

                }

                return {

                    name: result.name || raw.name,

                    type: result.type || raw.type,

                    url: result.data,

                    status: 'success' as const

                };

            }));



            if (processedFiles.length === 1) {

                return {

                    status: 'success' as const,

                    response: { url: processedFiles[0].url }

                };

            }



            return {

                status: 'success' as const,

                response: { files: processedFiles }

            };

        } catch (error) {

            const message = typeof error === 'string'

                ? error

                : error instanceof Error

                    ? error.message

                    : '文件上传失败';

            MessagePlugin.warning(message);

            return { status: 'fail' as const, error: message, response: {} };

        }

    }



    /**

     * 将表单存储的 JSON 字符串还原为 UploadFile 列表

     * 兼容旧数据（纯 URL 字符串数组）与新结构（FileAttachment 数组）

     */

    function parseAttachments(value?: string): UploadFile[] {

        if (!value) {

            return [];

        }

        try {

            const list = JSON.parse(value) as Array<string | FileAttachment>;

            if (!Array.isArray(list)) {

                return [];

            }

            return list.map((item, index) => {

                if (typeof item === 'string') {

                    return {

                        name: `附件${index + 1}`,

                        url: item,

                        status: 'success' as const

                    };

                }

                return {

                    name: item.name || `附件${index + 1}`,

                    type: item.type,

                    url: item.data,

                    status: 'success' as const

                };

            });

        } catch {

            return [];

        }

    }



    /** 将 UploadFile 列表序列化为表单字段 JSON 字符串 */

    function stringifyAttachments(files: UploadFile[]) {

        const list: FileAttachment[] = files

            .map(file => {

                const data = file.url || (file.response as { url?: string } | undefined)?.url;

                if (!data) {

                    return null;

                }

                const response = file.response as { type?: string; name?: string } | undefined;

                return {

                    name: file.name || response?.name || '附件',

                    type: file.type || response?.type || '',

                    data: String(data)

                };

            })

            .filter((item): item is FileAttachment => item != null);

        return list.length ? JSON.stringify(list) : '';

    }



    /** 提交前校验：不允许存在上传中或上传失败的附件 */

    function validateAttachments() {

        if (uploadFiles.value.some(file => file.status === 'progress')) {

            MessagePlugin.warning('附件正在上传中，请稍候');

            return false;

        }

        if (uploadFiles.value.some(file => file.status === 'fail')) {

            MessagePlugin.warning('存在上传失败的附件，请删除后重试');

            return false;

        }

        return true;

    }



    /** 清空附件列表 */

    function resetAttachments() {

        uploadFiles.value = [];

    }



    return {

        uploadFiles,

        beforeUpload,

        getFilePreviewUrl,

        uploadRequest,

        parseAttachments,

        stringifyAttachments,

        validateAttachments,

        resetAttachments

    };

}


