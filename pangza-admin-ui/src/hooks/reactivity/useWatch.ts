import { ref, watch, type WatchCallback, type WatchOptions } from "vue";

function useWatch<T>(value: T, fn?: WatchCallback<T, T>, option: WatchOptions = {}) {
    const stateProxy = ref<T>(value);

    const stop = watch(stateProxy, (...args) => {
        fn && fn(...args);
    }, option);

    return [stateProxy, stop] as const;
}

export default useWatch;