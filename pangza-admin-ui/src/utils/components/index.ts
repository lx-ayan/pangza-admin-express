import { isFunction } from "lodash-es";
import * as icons from "lucide-vue-next";
import StringUtil from "../clz/StringUtil";

const iconKeys = Object.keys(icons).filter(item => !['createLucideIcon', 'icons'].includes(item)).filter(item => !item.endsWith('Icon'));

export async function buildOptionData(data: OptionDataProps = [], keyname: string = 'label', valuename: string = 'value') {
    if (isFunction(data)) {
        const result = await data();
        return result.map((item) => buildOptionDataItem(item, keyname, valuename));
    } else {
        if (data.length) {
            return data.map((item) => buildOptionDataItem(item, keyname, valuename));
        } else {
            return [];
        }
    }
}

function buildOptionDataItem(item: OptionData, keyname: string = 'label', valuename: string = 'value') {
    return {
        label: item[keyname],
        value: item[valuename],
        disabled: item.disabled,
        render: item.render,
        meta: {
            ...item
        }
    }
}

export function getIconMap() {
    const nameMap: Record<string, string> = {};
    iconKeys.forEach(key => {
        nameMap[StringUtil.camelToKebab(key)] = key;
    });
    return nameMap;
}