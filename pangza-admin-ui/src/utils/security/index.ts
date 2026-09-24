import useUserStore from "@/store/userStore";

export function hasPermission(componentPermission: string | string[]) {
    const userStore = useUserStore();

    if (!userStore.token) return false;

    let _userPermission: string[] = [];
    let _componentPermission: string[] = [];
    if (typeof userStore.permission === 'string') {
        _userPermission = userStore.permission.split(',');
    } else {
        _userPermission = userStore.permission;
    }

    if (typeof componentPermission === 'string') {
        _componentPermission = componentPermission.split(',');
    } else {
        _componentPermission = componentPermission;
    }

    const resultFlag: boolean[] = [];

    _componentPermission.forEach(permission => {
        resultFlag.push(_userPermission.includes(permission));
    })

    return resultFlag.some(item => item === true) === true;
}