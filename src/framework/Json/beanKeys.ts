/**
 * 类字段名注册表：供 convert / 序列化发现目标属性。
 * 各属性装饰器（@JsonFormat / @JsonInclude / @JsonProperty / 校验注解）写入。
 */
const beanKeys = new WeakMap<Function, Set<string>>();

export function addBeanKey(ctor: Function, property: string): void {
  let set = beanKeys.get(ctor);
  if (!set) {
    set = new Set();
    beanKeys.set(ctor, set);
  }
  set.add(property);
}

export function getBeanKeys(ctor: Function): string[] {
  const own = beanKeys.get(ctor);
  const keys = new Set<string>(own ? [...own] : []);
  // 继承父类声明的字段
  let proto = Object.getPrototypeOf(ctor.prototype);
  while (proto && proto !== Object.prototype) {
    const parentCtor = proto.constructor;
    const parentKeys = beanKeys.get(parentCtor);
    if (parentKeys) {
      for (const k of parentKeys) keys.add(k);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return [...keys];
}
