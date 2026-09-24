const module = import.meta.glob('./*.ts', { eager: true });
function getDirectiveList() {
    let directiveList: any[] = [];
    Object.entries(module).forEach(([key]) => {
        if (!key.includes('index.ts')) {
            directiveList.push((module[key] as any).default);
        }
    })
    return directiveList;
}

export default getDirectiveList;