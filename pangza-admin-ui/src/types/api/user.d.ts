interface LoginResult extends OtherParam {
    username: string;
    permission: string | string[];
    token: string;
    nickName?: string;
    avatar?: string;
}

interface LoginDTO extends OtherParam {
    username: string;
    password: string;
    /** 登录平台：PC / MOBILE */
    platform?: 'PC' | 'MOBILE';
}

interface LoginRequest {
    sessionId: string;
    loginParam: string;
}

interface User {
    id: string;
    username: string;
    nickName: string;
    avatar?: string;
    email?: string;
    phone?: string;
    address?: string;
}

/** 修改账户信息 */
interface UpdateProfileDTO {
    nickName?: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar?: string;
}

/** 修改密码 */
interface UpdatePasswordDTO {
    oldPassword: string;
    newPassword: string;
}

type CreateUserDTO = Exclude<User, 'id'>;
