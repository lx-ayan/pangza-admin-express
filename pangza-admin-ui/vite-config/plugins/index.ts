import type { Plugin } from "vite";
import Vue from '@vitejs/plugin-vue';
import VueJSX from '@vitejs/plugin-vue-jsx';
import { seupMockPlugin } from "./mock";
import viteCompression from 'vite-plugin-compression';
import { setupCDN } from './cdn';

function setupPlugins(env: ViteEnv, isBuild: boolean = false): Plugin[] {

    const plugins = [Vue(), VueJSX()] as Plugin[];

    if (env.VITE_ENABLE_MOCK) {
        plugins.push(seupMockPlugin(isBuild));
    }

    plugins.push(viteCompression({
        filter: /\.(js|css|json|txt|ico|svg)(\?.*)?$/i,
        threshold: 10240,
        algorithm: 'gzip',
        ext: 'gz',
        compressionOptions: { level: 9 },
        deleteOriginFile: false
    }));

    if (env.VITE_ENABLE_CDN) {
        if (env.VITE_CDN_IMPORT) {
            plugins.push(setupCDN(env));
        }
    }

    return plugins;

}

export default setupPlugins;