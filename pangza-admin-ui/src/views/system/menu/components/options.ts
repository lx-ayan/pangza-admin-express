import type { ProFormInputNumberProps, ProFormOption } from "@/components/ProComponents";
import { MENU_TYPE, YES_OR_NO } from "@/utils/data/constant";
import type { TdInputNumberProps } from "tdesign-vue-next";

export const formOptions: ProFormOption[] = [
    {
        name: 'name',
        label: '菜单名称',
        gridProps: {
            colSpan: 12
        },
        rules: [
            { required: true, message: '请输入菜单名称' }
        ]
    },
    {
        label: '菜单标题',
        name: 'title',
        gridProps: {
            colSpan: 12
        },
        rules: [
            { required: true, message: '请输入菜单标题' }
        ]
    },
    {
        label: '类型',
        name: 'type',
        type: 'select',
        data: MENU_TYPE,
        defaultValue: '1',
        gridProps: {
            colSpan: 12
        },
        rules: [
            { required: true, message: '请输入菜单标题' }
        ]
    },
    {
        label: '菜单路径',
        name: 'path',
        gridProps: {
            colSpan: 12
        },
        rules: [
            { required: true, message: '请输入菜单路径' }
        ],
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '权限标识',
        name: 'permission',
        gridProps: {
            colSpan: 12
        },
        props: {
            formProps: {
                tips: '不填写则不进行权限控制'
            }
        },
    },
    {
        label: '父级菜单',
        name: 'parentId',
        gridProps: {
            colSpan: 12
        },
    },
    {
        label: '图标',
        name: 'icon',
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '是否认证',
        name: 'auth',
        type: 'radio',
        data: YES_OR_NO,
        defaultValue: 1,
        gridProps: {
            colSpan: 12
        },
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '是否隐藏',
        name: 'hidden',
        type: 'radio',
        data: YES_OR_NO,
        defaultValue: 0,
        gridProps: {
            colSpan: 12
        },
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '是否外链',
        name: 'link',
        type: 'radio',
        data: YES_OR_NO,
        defaultValue: 0,
        gridProps: {
            colSpan: 12
        },
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '是否内嵌',
        name: 'frame',
        type: 'radio',
        data: YES_OR_NO,
        defaultValue: 0,
        gridProps: {
            colSpan: 12
        },
        hidden: (formModel) => formModel?.type == '2'
    },
    {
        label: '链接地址',
        name: 'href',
        hidden: (formModel) => (formModel?.type == '2' || (formModel?.link == 2 && formModel?.frame == 2))
    },
    {
        label: '排序',
        name: 'sortNum',
        type: 'inputNumber',
        defaultValue: 0,
        props: {
            inputNumberProps: {
                theme: 'normal',
                style: 'width: 100%'
            } as TdInputNumberProps,
            formProps: {
                tips: '数字越小越靠前'
            }
        } as ProFormInputNumberProps
    }
];