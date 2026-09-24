import { RouteMeta } from 'vue-router';

export interface MenuResult {
    path: string;
    name: string;
    meta?: RouteMeta;
    children?: MenuResult[];
    [name: string]: any;
}

export interface MenuPageDTO {
    name?: string;
    title?: string;
    type?: string;
}

export interface MenuPageVO {
    id?: string;
    name?: string;
    path?: string;
    title?: string;
    type?: string;
    auth?: number;
    link?: number;
    frame?: number;
    sortNum?: number;
    parentId?: string;
    parentTitle?: string;
    icon?: string;
}

export interface CreateMenuDTO {
    name?: string;
    path?: string;
    title?: string;
    type?: string;
    auth?: number;
    link?: number;
    frame?: number;
    sortNum?: number;
    parentId?: string;
    icon?: string;
}