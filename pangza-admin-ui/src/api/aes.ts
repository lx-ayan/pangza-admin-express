import useRequest from "@/hooks/core/useRequest";

const request = useRequest('/api/aes', { wait: 200 });

export function getAESKey() {
    return request.get<{ aesKey: string, sessionId: string }>('/key');
}