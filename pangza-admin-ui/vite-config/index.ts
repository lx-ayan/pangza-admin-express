import { loadEnv, type UserConfigFnObject } from "vite";
import userConfig from "./config";
import alias from "./alias";
import setupPlugins from "./plugins";
import { parseEnv } from "./env";
import buildProxy from "./proxy";
import { setupViteBuild } from "./build";

const buildViteConfig: UserConfigFnObject = ({ mode }) => {
    if (userConfig) return userConfig;
    const root = process.cwd();
    const env = parseEnv(loadEnv(mode, root));
    const proxy = buildProxy(env);
    const cdnEnabled = env.VITE_ENABLE_CDN;
    return {
        plugins: setupPlugins(env, mode === 'production'),
        resolve: {
            alias
        },
        build: setupViteBuild(env),
        server: {
            port: env.VITE_PORT,
            proxy,
            host: true,
        },
        optimizeDeps: {
            include: cdnEnabled ? env.VITE_BUILD_EXTERNAL || [] : []
        }
    }
}

export default buildViteConfig;