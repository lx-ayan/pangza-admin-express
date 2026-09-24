import JSZip from 'jszip';
import type { CodeFileItem, CodeGenModel } from '../types';

/** 下载代码 zip 包 */
export async function downloadCodeZip(model: CodeGenModel, files: CodeFileItem[]) {
    const zip = new JSZip();
    files.forEach((file) => {
        zip.file(file.zipPath, file.code);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${model.genConfig.entityName}_code.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
