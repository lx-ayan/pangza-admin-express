import request from '@/plugins/axios';

/** 文件上传返回项 */
export interface FileUploadResult {
    /** 原始文件名 */
    name: string;
    /** MIME 类型 */
    type: string;
    /** 可访问地址 */
    data: string;
    /** 文件大小（字节） */
    size: number;
}

/**
 * 上传文件到指定桶
 * @param bucket 桶名（目录名），如 task-audit
 * @param files 单个文件或文件数组
 */
export function uploadFiles(bucket: string, files: File | File[]) {
    const formData = new FormData();
    formData.append('bucket', bucket);
    const fileList = Array.isArray(files) ? files : [files];
    fileList.forEach((file) => {
        formData.append('files', file);
    });
    // 不手动设置 Content-Type，交给浏览器自动带 boundary
    return request.post<FileUploadResult[]>('/api/file/upload', formData, {
        timeout: 120000,
    });
}