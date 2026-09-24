import { ref } from "vue";
import * as XLSX from 'xlsx';

interface UseXLSXOption {
    json?: boolean;
    needHeader?: boolean;
    emptyText?: string;
}

export function useXLSX(titleOptions: Array<{ title: string, key: string }>, option: UseXLSXOption = {}) {

    const xlsx = ref<XLSX.XLSX$Utils>(XLSX.utils);

    const { json = false, needHeader = true, emptyText = '-' } = option;

    function getTitleList() {
        const titles = titleOptions.map(item => item.title);
        return titles;
    }

    function getKeyList() {
        const titles = titleOptions.map(item => item.key);
        return titles;
    }

    function doExport(data: any[], name: string) {
        const xlsxWB = xlsx.value.book_new();
        const xlsxWSFn = !json ? xlsx.value.aoa_to_sheet : xlsx.value.json_to_sheet;
        let resultData = json ? data : parseData(data);
        const xlsxWS = xlsxWSFn(resultData);
        XLSX.utils.book_append_sheet(xlsxWB, xlsxWS, "Sheet1");
        XLSX.writeFile(xlsxWB, name, { compression: true });
    }

    function parseData(data: any[]): any[] {
        const result = needHeader ? [getTitleList()] : [];
        const keyList = getKeyList();
        data.forEach(item => {
            const rowData: any[] = [];
            keyList.forEach(key => {
                rowData.push(item[key] ? item[key] : emptyText)
            })
            result.push(rowData);
        })
        return result;
    }

    function doReadData(file: File | Blob) {
        return new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.readAsArrayBuffer(file);
            fr.onerror = function (e) {
                reject(e);
            }
            fr.onload = function (e) {
                const fileData = e.target?.result;
                const workbook = XLSX.read(fileData, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheetJSON = xlsx.value.sheet_to_json(workbook.Sheets[sheetName]);
                resolve(sheetJSON);
            }
        })
    }

    return [xlsx, doExport, doReadData] as const;
}