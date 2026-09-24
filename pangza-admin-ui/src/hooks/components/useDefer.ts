import { onUnmounted, ref } from 'vue';
export default function useDefer(max: number) {

    const frameCount = ref(1);

    let rafId: number | null = null;

    // @ts-ignore
    function updateFrameCount() {
        rafId = requestAnimationFrame(() => {
            frameCount.value++;
            if (frameCount.value > max) return;
            updateFrameCount();
        });
    }

    updateFrameCount();

    onUnmounted(() => {
        cancelAnimationFrame(rafId!);
        rafId = null;
    })

    function defer(n: number): boolean {
        return frameCount.value >= n
    }

    return [defer, frameCount] as const;
}