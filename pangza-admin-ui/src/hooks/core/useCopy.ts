import { isFunction } from "lodash-es";


function useCopy(text: string, beforeCopy?: (...args: any[]) => void | Promise<void>): Promise<string> {
    return new Promise(async (resolve, reject) => {
        try {
            if (!text) {
                resolve(text);
                return;
            }

            if (isFunction(beforeCopy)) {
                await beforeCopy();
            }

            if (navigator.clipboard && isFunction(navigator.clipboard.writeText)) {
                await navigator.clipboard.writeText(text)
            } else {
                const textarea = document.createElement('textarea');
                textarea.style.position = 'absolute';
                textarea.style.left = '-9999px';
                textarea.style.top = '-9999px';
                textarea.readOnly = true;
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                if (!success) {
                    throw new Error('降级复制失败，请手动复制');
                }
            }
            resolve(text);
        } catch (e) {
            const error = e as Error;
            const errorMsg = error.message || "复制失败";
            reject(errorMsg);
        }
    })
}

export default useCopy;