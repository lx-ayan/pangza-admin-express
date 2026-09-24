import type { VNode } from "vue";

export interface ContextMenuOption {
    content: string | (() => VNode);
    value: string | number;
    disabled?: boolean;
    hidden?: boolean | (() => boolean);
}