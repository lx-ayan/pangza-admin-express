import { getCurrentTime } from "@/utils/core/date";

interface ThrottleOption {
    count?: number; // 允许调用次数
    onThrottle?: (long: number) => void; // 节流中钩子
}

function useThrottle(callback: FunctionArgs, long: number, option: ThrottleOption = {}) {
    let lastTime: Nullable<number> = null;
    let handleCount = 0;
    let { count = 1 } = option;

    function isThrottle() {
        if (lastTime === null) return false;
        const now = getCurrentTime();
        if (now - lastTime >= long) {
            handleCount = 0;
            lastTime = now;
            return false;
        }
        return handleCount >= count;
    }

    function handle(...args: any[]) {
        if (isThrottle()) {
            if (option.onThrottle) {
                option.onThrottle((lastTime + long) - getCurrentTime());
            }
            return;
        }
        callback(...args);
        handleCount++;
        lastTime = getCurrentTime();
    }

    function cancel() {
        lastTime = null;
        handleCount = 0;
    }

    return [handle, cancel, isThrottle] as const;
}

export default useThrottle;