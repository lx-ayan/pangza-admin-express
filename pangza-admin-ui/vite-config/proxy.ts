import type { ProxyOptions } from 'vite';
const BOOL_VALUE = ['true', 'false'] as const;

type ProxyConfig = Record<string, ProxyOptions>;

function buildProxy(env: ViteEnv): ProxyConfig {
    
    const apiProxyList = env.VITE_PROXY || [];

    const result: ProxyConfig = {};

    apiProxyList.forEach(item => {
        const [prefix, url, rewrite] = item.split('|');
        let parseRewrite: boolean = BOOL_VALUE.includes(rewrite as typeof BOOL_VALUE[number]) ? (rewrite === 'true') : false;
        result[prefix] = {
            target: url,
            changeOrigin: true,
            rewrite: parseRewrite ? (path) => path.replace(new RegExp(`^${prefix}`), '') : undefined,
        };
    });

    return result;
}

export default buildProxy;