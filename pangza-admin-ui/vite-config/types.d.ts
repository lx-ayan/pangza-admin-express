interface ViteEnv {
    VITE_PORT?: number;
    VITE_PROXY?: Array<string>;
    VITE_LOAD_ROUTER?: 'view' | 'module' | 'server';
    VITE_ENABLE_MOCK?: boolean;
    VITE_ENABLE_CDN?: boolean;
    VITE_DROP_CONSOLE?: boolean;
    VITE_CDN_IMPORT?: Array<string>;
    VITE_BUILD_EXTERNAL?: Array<string>;
}

interface ImportMetaEnv extends ViteEnv { }

interface ImportMeta {
    env: ImportMetaEnv;
}