import type { ProTableRequest, ProTableResult } from "@/components/ProComponents";
import useRequest from "@/hooks/core/useRequest";
import type { BindRoleDTO, CreateRoleDTO, GetRolePageDTO, Role, UpdateRoleDTO } from "@/types/api/role";

const request = useRequest('/api/role', {
    wait: 300
});

export function createRole(data: CreateRoleDTO) {
    return request.post('/create', data);
}

export function updateRole(data: UpdateRoleDTO) {
    return request.post('/update', data);
}

export function deleteRole(id: string) {
    return request.post(`/delete/${id}`)
}

export function getRole(id: string) {
    return request.post<Role>(`/get/${id}`)
}

export function getRolePage(data: ProTableRequest<GetRolePageDTO>) {
    return request.post<ProTableResult<Role>>('/page', data);
}

export function bindMenu(data: BindRoleDTO) {
    return request.post('/bind_menu', data);
}

export function getRoleMenuIds(id: string) {
    return request.post<string[]>(`/get/menu/${id}`)
}

export function getRoleList() {
    return request.get<Role[]>('/list');
}