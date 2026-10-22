# Json 装饰器：返回值如何被格式化

源码：`Json/decorators.ts`、`ObjectMapper.ts`、`convert.ts`、`beanKeys.ts`

---

## 一、在整条链路中的位置

普通（非 flux/raw）接口返回后：

```ts
result = await callback(...args);
const serialized = ObjectMapper.writeValue(result);  // ← 读 @JsonFormat / @JsonInclude
response.send(ResponseData.success(serialized));
```

装饰器阶段只把「字段怎么格式化、空值要不要输出」写进元数据 / 全局 Map；**真正干活的是 ObjectMapper**。

也可：

```ts
Application.registry(Json({ dateFormat: "yyyy-MM-dd HH:mm:ss", include: JsonIncludeType.NON_NULL }));
// 或
ObjectMapper.configure({ ... });
```

---

## 二、`@JsonFormat(options?)`

### 做什么

标记某个属性序列化时的格式（当前主要用于日期）。

### 参数

| 字段 | 说明 |
|------|------|
| `pattern?` | 如 `yyyy-MM-dd HH:mm:ss` |
| `timezone?` | 时区 |

### 实现

```ts
export function JsonFormat(options: JsonFormatOptions = {}): PropertyDecorator {
  return (target, propertyKey) => {
    const ctor = target.constructor;
    const property = String(propertyKey);
    addBeanKey(ctor, property);
    // 1) 记在类上（有原型信息时精确匹配）
    Reflect.defineMetadata(JSON_FORMAT_KEY, { ...map, [property]: { property, options } }, ctor);
    // 2) 同时记全局 Map：ORM 常返回 plain object，可按「字段名」回退匹配
    globalFieldFormats.set(property, options);
  };
}
```

**为何 plain object 也能格式化：** 查库结果往往不是 `new User()`，没有原型上的类元数据，所以用字段名 → `globalFieldFormats` 回退。

```ts
class UserVo {
  @JsonFormat({ pattern: "yyyy-MM-dd HH:mm:ss" })
  createTime?: Date;
}
```

---

## 三、`@JsonInclude(valueOrOptions?)`

### 做什么

控制「空值要不要进 JSON」，对齐 Jackson `@JsonInclude`。

### 参数

可传枚举或 `{ value: JsonIncludeType }`：

| JsonIncludeType | 行为 |
|-----------------|------|
| `ALWAYS` | 都输出 |
| `NON_NULL` | 跳过 null/undefined（常用） |
| `NON_EMPTY` | 再跳过 `""` / `[]` / `{}` |
| `NON_DEFAULT` | 跳过类型默认值 |

### 类装饰器 vs 属性装饰器

同一函数两种用法，靠有没有 `propertyKey` 区分：

```ts
export function JsonInclude(...): ClassDecorator & PropertyDecorator {
  return (target, propertyKey?) => {
    if (propertyKey !== undefined) {
      // 属性：写 pangza.json.include + globalFieldIncludes
      return;
    }
    // 类：写 pangza.json.classInclude
    Reflect.defineMetadata(JSON_CLASS_INCLUDE_KEY, options, target);
  };
}
```

```ts
@JsonInclude(JsonIncludeType.NON_NULL)
class UserVo {
  @JsonInclude(JsonIncludeType.NON_EMPTY)
  tags?: string[];
}
```

属性级优先于类级（具体以 ObjectMapper 实现为准）。

---

## 四、`@JsonProperty()`

### 做什么

标记字段参与 `convert(source, TargetClass)` / `copyProperties` 的投影。

### 实现

不走 Reflect 业务键，而是 `addBeanKey(ctor, property)` 写入 WeakMap 字段清单。  
`convert` 遍历这些 key，从 source 拷到新对象。

```ts
class User {
  @JsonProperty() username!: string;
  @JsonProperty() password!: string;
  tags?: any; // 未标记：convert(User) 时通常不带
}

convert({ username: "a", password: "b", tags: [] }, User);
// → { username: "a", password: "b" }
```

也支持：`convert(source, ["username", "password"])`。

---

## 五、相关 API

| API | 作用 |
|-----|------|
| `ObjectMapper.writeValue(obj)` | 序列化出口 |
| `ObjectMapper.configure(opts)` | 全局默认 format/include |
| `convert` / `copyProperties` / `pick` | DTO 转换 |

---

## 六、为何「能识别」字段注解？

1. 属性装饰器在类定义时执行 → 元数据 / 全局 Map 已有记录  
2. `writeValue` 遍历对象 key，查类元数据或全局 Map  
3. 实体上的 `@TableField` 也会 `addBeanKey`，与 Json 体系共享字段清单
