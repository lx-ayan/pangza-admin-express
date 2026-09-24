import { hasPermission } from "@/utils/security";
import type { Directive } from "vue";

const permission = {
    name: 'permission',
    mounted: (el, binding) => {
        const bValue = binding.value;
        let permission: string[] = bValue;
        if (!hasPermission(permission)) {
            el.remove();
        }
    }
} as Directive;

export default permission;