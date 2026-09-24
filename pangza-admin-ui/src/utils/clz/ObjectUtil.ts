class ObjectUtil {

    public static isNull(obj: unknown): obj is null {
        return obj === null;
    }

    public static isUndef(obj: unknown): obj is undefined {
        return obj === undefined;
    }

    public static isNil(obj: unknown): obj is null | undefined {
        return this.isNull(obj) || this.isUndef(obj);
    }

    public static hasKey(
        object: Record<string | symbol, any>,
        key: string | symbol
    ): boolean {
        return Object.prototype.hasOwnProperty.call(object, key);
    }


    public static isEmpty(value: unknown): boolean {
        if (this.isNil(value)) {
            return true;
        }

        if (typeof value === 'string') {
            return value.length === 0;
        }

        if (Array.isArray(value) || value instanceof Array || (value as any).length !== undefined) {
            return (value as any).length === 0;
        }

        if (value instanceof Map) {
            return value.size === 0;
        }

        if (value instanceof Set) {
            return value.size === 0;
        }

        if (typeof value === 'object' && value !== null) {
            return Object.keys(value as object).length === 0;
        }

        return false;
    }


    public static isEqual(a: any, b: any): boolean {
        if (a === b) {
            return true;
        }

        if (a === null || a === undefined || b === null || b === undefined) {
            return a === b;
        }

        if (a instanceof Date && b instanceof Date) {
            return a.getTime() === b.getTime();
        }

        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) return false;
            }
            return true;
        }

        if (a instanceof Object && b instanceof Object) {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            for (const key of keysA) {
                if (!keysB.includes(key) || a[key] !== b[key]) return false;
            }
            return true;
        }

        return false;
    }

    public static isObject(obj: unknown, strict: boolean = false): obj is object {
        if (this.isNil(obj) || typeof obj !== 'object') {
            return false;
        }

        if (!strict) {
            return true;
        }

        const proto = Object.getPrototypeOf(obj);
        return (
            proto === Object.prototype ||
            (proto === null && Object.prototype.toString.call(obj) === '[object Object]')
        );
    }

    public static cloneDeep(data: any, cloneDeepFn?: (v: typeof data) => typeof v) {
        if (cloneDeepFn) {
            return cloneDeepFn(data);
        }

        if (ObjectUtil.isObject(data) || Array.isArray(data)) {
            return JSON.parse(JSON.stringify(data));
        } else {
            return data;
        }
    }

    public static isNotEmpty(value: unknown): boolean {
        return !ObjectUtil.isEmpty(value);
    }
}

export default ObjectUtil;