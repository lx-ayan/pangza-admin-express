import ObjectUtil from "@/utils/clz/ObjectUtil";
import { ref } from "vue";

function useResetRef<T>(state: T, resetValue: () => T) {

    const stateProxy = ref<T>(ObjectUtil.cloneDeep(state));

    function reset() {
        stateProxy.value = resetValue();
    }

    return [stateProxy, reset];
}

export default useResetRef;