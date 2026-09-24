import ObjectUtil from "@/utils/clz/ObjectUtil";
import { readonly, ref } from "vue";

function useState<T = any>(value: T) {

    const stateProxy = ref<T>(ObjectUtil.cloneDeep(value));

    const defaultState = readonly(ref(value));

    function setState(value: T | ((prevValue: T) => T)) {
        const newValue = typeof value === 'function'
            ? (value as (prevState: T) => T)(stateProxy.value)
            : value;

        if (ObjectUtil.isEqual(newValue, stateProxy.value)) {
            return;
        }
        stateProxy.value = newValue;
    }

    return [readonly(stateProxy), setState, defaultState] as const;
}

export default useState;