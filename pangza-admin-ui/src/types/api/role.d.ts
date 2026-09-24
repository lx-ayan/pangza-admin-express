export interface Role {
    id: string;
    name: string;
    nameZh: string;
    description: string;
}

export type CreateRoleDTO = ExcludeAndPartial<Role, 'id'>;

export type UpdateRoleDTO = Optional<Role, 'description' | 'nameZh'>;

export type GetRolePageDTO = ExcludeAndPartial<Role, 'id' | 'description'>;

export interface BindRoleDTO {
    roleId: string;
    menuIds: string[];
}
