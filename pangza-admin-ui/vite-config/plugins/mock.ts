import { viteMockServe } from 'vite-plugin-mock';

export function seupMockPlugin(isBuild: boolean) {
    return viteMockServe({
        mockPath: 'mock',
        enable: !isBuild,
    });
}