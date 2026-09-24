import type { BuildEnvironmentOptions } from "vite";

export function setupViteBuild(env: ViteEnv): BuildEnvironmentOptions {
    return {
        rollupOptions: {
            external: env.VITE_BUILD_EXTERNAL,
            output: {
                manualChunks: (name) => {
                    if (name.includes('node_modules')) {
                        return 'vendor';
                    }
                    return 'index';
                }
            }
        },
        terserOptions: {
            //@ts-ignore
            compress: {
                drop_console: env.VITE_DROP_CONSOLE,
                drop_debugger: true
            }
        },
    }
}

