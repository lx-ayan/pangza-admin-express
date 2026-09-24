
const moduleList: Record<string, any> = import.meta.glob('../../../router/modules/**/index.ts', { eager: true });

export function autoloadByModules() {
    const routes: any[] = [];
    Object.keys(moduleList).forEach(key => {
        routes.push(moduleList[key as any].default);
    });
    return routes;
}