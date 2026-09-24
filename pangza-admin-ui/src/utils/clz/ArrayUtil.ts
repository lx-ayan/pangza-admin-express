class ArrayUtil {
    static paginateArray(arr: any[], page = 1, pageSize = 10) {
        if (!Array.isArray(arr)) throw new Error('arr is not Array');
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return arr.slice(startIndex, endIndex);
    }

    static isEmpty(list: any[]) {
        if (!Array.isArray(list)) {
            return true;
        }
        return list.length <= 0;
    }

    static isNotEmpty(list: any[]) {
        return !ArrayUtil.isEmpty(list);
    }
}

export default ArrayUtil;