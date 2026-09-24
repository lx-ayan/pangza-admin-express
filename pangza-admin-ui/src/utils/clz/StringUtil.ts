import { CHINESE_REG, EMAIL_REG, PHONE_REG } from "../data/constant";
import ObjectUtil from "./ObjectUtil";

const INNER_REGS = {
  phone: PHONE_REG,
  email: EMAIL_REG,
  chinese: CHINESE_REG,
};

class StringUtil {
  public static isNull(str: string): boolean {
    return ObjectUtil.isNull(str);
  }

  public static isStringEmpty(str: string) {
    return str.trim() === "";
  }

  public static isEmpty(str: string) {
    return (
      ObjectUtil.isUndef(str) ||
      StringUtil.isStringEmpty(str) ||
      StringUtil.isNull(str)
    );
  }

  public static getCount(str: string, char: string) {
    let count = 0;
    for (let idx = 0; idx < str.length; idx++) {
      const item = str[idx];
      if (item == char) {
        count++;
      }
    }
    return count;
  }

  public static is(str: string, reg: RegExp | keyof typeof INNER_REGS) {
    let targetReg: RegExp;
    if (reg instanceof RegExp) {
      targetReg = reg;
    } else {
      targetReg = INNER_REGS[reg];
      if (!targetReg) return false;
    }

    return targetReg.test(str);
  }

  static buildString(prefix: string, ...strs: (string | { text: string, split: string })[]) {
    let resultStr = prefix;
    strs.forEach(item => {
      resultStr += typeof item === 'string' ? item : item.split + item.text;
    })
    return resultStr;
  }

  static camelToKebab(str: string): string {
    if (!str) return '';
    return str
      .replace(/(?<!^)([A-Z]|\d+)/g, '-$1')
      .toLowerCase();
  }
}

export default StringUtil;
