import type { ProTableRequest } from "@/components/ProComponents";
import useRequest from "@/hooks/core/useRequest";
import type { CreateMenuDTO, MenuPageDTO, MenuPageVO, MenuResult } from "@/types/api/menu";

const request = useRequest('/api/menu')

export function getUserRouter() {
    return request.get<MenuResult[]>('/router');
}

export function getMenuPage(data: ProTableRequest<MenuPageDTO>) {
    return request.post<ProTableRequest<MenuResult>>('/page', data);
}

export function getMenuWithChildren() {
    return request.get<MenuResult[]>('/menu_with_children');
}

export function createMenu(data: CreateMenuDTO) {
    return request.post('/create', data);
}

export function getMenu(id: string) {
    return request.get<MenuPageVO>(`/${id}`);
}

export function updateMenu(data: CreateMenuDTO & { id: string }) {
    return request.post('/update', data);
}

export function deleteMenu(id: string) {
    return request.post(`/delete/${id}`);
}

/** 查询菜单已绑定的角色 id 列表 */
export function getMenuRoleIds(menuId: string) {
    return request.get<string[]>(`/get/role/${menuId}`);
}

/** 菜单绑定角色（先删后增） */
export function bindMenuRole(data: { menuId: string; roleIds: string[] }) {
    return request.post('/bind_role', data);
}
