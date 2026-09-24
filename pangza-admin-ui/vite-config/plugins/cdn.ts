import type { Plugin } from 'vite';
import ViteCdnPlugin, { type Options } from 'vite-plugin-cdn-import';
export function setupCDN(env: ViteEnv): Plugin {

    const { VITE_CDN_IMPORT } = env;

    const modules: Options['modules'] = [];

    VITE_CDN_IMPORT!.forEach(option => {
        const [module, globalName, url, cssUrl] = option.split('|');
        const item: any = {
            var: globalName,
            name: module,
            path: url
        }

        if (cssUrl) {
            item['css'] = [
                cssUrl
            ]
        }

        modules.push(item);
    });

    return ViteCdnPlugin({
        modules
    }) as unknown as Plugin;
}