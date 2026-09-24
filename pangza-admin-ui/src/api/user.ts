import type { ProTableRequest, ProTableResult } from "@/components/ProComponents/ProTable/types";
import useRequest from "@/hooks/core/useRequest";

const request = useRequest('/api/user');

export function login(data: LoginDTO) {
    return request.post<LoginResult>('/login', data);
}

/** 退出登录 */
export function logout() {
    return request.post('/logout');
}

/** 查询当前登录用户账户信息 */
export function getProfile() {
    return request.get<User>('/profile');
}

/** 修改当前登录用户账户信息（含头像） */
export function updateProfile(data: UpdateProfileDTO) {
    return request.post<User>('/profile/update', data);
}

/** 修改当前登录用户密码 */
export function updatePassword(data: UpdatePasswordDTO) {
    return request.post('/profile/password', data);
}

export function getUserList(data: ProTableRequest) {
    return request.post<ProTableResult<LoginResult>>('/page', data, { debounceOption: { wait: 200 } });
}

export function createUser(data: CreateUserDTO) {
    return request.post('/create', data);
}

export function updateUser(data: User) {
    return request.post('/update', data);
}

export function getUser(id: string) {
    return request.post<User>(`/get/${id}`)
}

export function getUserRole(id: string) {
    return request.get<string[]>(`/get_role/${id}`);
}

/** 绑定用户角色 */
export function bindUserRole(data: { userId: string; roleIds: string[] }) {
    return request.post('/bind_role', data);
}

export function deleteUser(id: string) {
    return request.post(`/delete/${id}`)
}