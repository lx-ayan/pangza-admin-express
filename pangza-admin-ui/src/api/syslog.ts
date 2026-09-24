import useRequest from "@/hooks/core/useRequest";

const request = useRequest('/api/log', {
    wait: 200
})

export function getSysLogPage(data: any) {
    return request.post('/page', data);
}

export function exportSysLog(data: any) {
    return request.get('/export', data, {
        requestOption: {
            responseType: 'blob'
        }
    });
}