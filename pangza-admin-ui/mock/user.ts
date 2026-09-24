import type { MockMethod } from 'vite-plugin-mock';
import { addressList, avatarList, birthdayList, emailList, menuList, phoneList, roleList, userList, usernameList } from './data';

export default [
    {
        url: '/api/users',
        method: 'get',
        response: () => {
            return {
                code: 200,
                data: [
                    { id: 1, name: '张三' },
                    { id: 2, name: '李四' },
                    { id: 3, name: '王五' }
                ],
                message: '请求成功'
            }
        }
    },
    {
        url: '/api/user/login',
        method: 'post',
        response: ({ body }) => {
            const { username } = body;
            const user = userList.find(item => item.username === username);
            return {
                code: user ? 200 : 500,
                data: user,
                message: user ? '登录成功' : '用户名密码输入错误'
            }
        }
    },
    {
        url: '/api/user/router',
        method: 'post',
        response: () => {
            return {
                code: 200,
                data: menuList,
                message: '登录成功'
            }
        }
    },
    {
        url: '/api/user/list',
        method: 'post',
        response: ({ body }) => {
            const { pageSize } = body;
            const list = [];
            for (let i = 0; i < pageSize; i++) {
                list.push({
                    id: i + 1,
                    username: usernameList[i % usernameList.length],
                    avatar: avatarList[i % avatarList.length],
                    email: emailList[i % emailList.length],
                    phone: phoneList[i % phoneList.length],
                    address: addressList[i % addressList.length],
                    birthday: birthdayList[i % birthdayList.length],
                })
            }
            return {
                code: 200,
                data: {
                    list,
                    total: 100
                },
                message: '请求成功'
            }
        }
    },
    {
        url: '/api/user/roles',
        method: 'post',
        response: () => {
            return {
                code: 200,
                data: {
                    total: 20,
                    list: roleList
                },
                message: '请求成功'
            }
        }
    }
] as MockMethod[];